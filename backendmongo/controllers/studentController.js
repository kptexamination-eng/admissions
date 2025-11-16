// controllers/studentController.js

import Student from "../models/Student.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

/* ----------------------------------------------------------
   HELPER: Generate Application Number
   Format: APP-2025-0001
----------------------------------------------------------- */
function generateApplicationNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `APP-${year}-${rand}`;
}

/* ----------------------------------------------------------
   HELPER: Generate Admission Number
   Format: CSE-2025-4123
----------------------------------------------------------- */
function generateAdmissionNumber(department, entryYear) {
  const code = department.substring(0, 3).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${code}-${entryYear}-${rand}`;
}

/* ----------------------------------------------------------
   CREATE STUDENT APPLICATION
----------------------------------------------------------- */
export const createStudentApplication = async (req, res) => {
  try {
    const payload = req.body;

    const required = [
      "clerkId",
      "entryType",
      "entryYear",
      "program",
      "department",
      "identity.studentName",
    ];

    for (let field of required) {
      const parts = field.split(".");
      let value = payload;
      for (let p of parts) value = value?.[p];
      if (!value) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    /* -----------------------------------------
       CREATE/VERIFY USER LINKED TO CLERK
    ----------------------------------------- */
    let userDoc = await User.findOne({ clerkId: payload.clerkId });

    if (!userDoc) {
      userDoc = await User.create({
        clerkId: payload.clerkId,
        firstName: payload.identity?.studentName?.split(" ")[0] || "",
        lastName: payload.identity?.studentName?.split(" ").slice(1).join(" "),
        email: payload.contact?.email || "",
        role: "Student",
      });
    }

    /* -----------------------------------------
       BUILD STUDENT DOC
    ----------------------------------------- */
    const student = new Student({
      user: userDoc._id,
      clerkId: payload.clerkId,

      applicationNumber: generateApplicationNumber(),
      entryType: payload.entryType,
      entryYear: payload.entryYear,
      program: payload.program,
      department: payload.department,
      branch: payload.branch,
      batch: payload.batch,

      status: payload.submit ? "Pending" : "Draft",
      appliedAt: payload.submit ? new Date() : null,

      identity: payload.identity,
      studyDetails: payload.studyDetails,
      marks: payload.marks,

      contact: payload.contact,
      permanentAddress: payload.permanentAddress,
      currentAddress: payload.currentAddress,

      parents: payload.parents,
      courseOptions: payload.courseOptions,
      documents: payload.documents,
      notes: payload.notes,

      createdBy: userDoc._id,
    });

    await student.save();

    return res.status(201).json({
      success: true,
      message: "Application submitted",
      student,
    });
  } catch (err) {
    console.error("CREATE ERROR:", err);
    return res.status(500).json({ error: "Server error while creating" });
  }
};

/* ----------------------------------------------------------
   UPDATE STUDENT APPLICATION
----------------------------------------------------------- */
export const updateStudentApplication = async (req, res) => {
  try {
    const studentId = req.params.id;
    const updates = req.body;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: "Not found" });

    // only student who created OR Admin/OfficeAdmission can edit
    if (
      student.clerkId !== req.user?.sub &&
      req.user?.role !== "Admin" &&
      req.user?.role !== "OfficeAdmission"
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Overwrite nested objects
    student.identity = updates.identity || student.identity;
    student.studyDetails = updates.studyDetails || student.studyDetails;
    student.marks = updates.marks || student.marks;
    student.contact = updates.contact || student.contact;
    student.permanentAddress =
      updates.permanentAddress || student.permanentAddress;
    student.currentAddress = updates.currentAddress || student.currentAddress;

    student.parents = updates.parents || student.parents;
    student.courseOptions = updates.courseOptions || student.courseOptions;
    student.documents = updates.documents || student.documents;
    student.notes = updates.notes ?? student.notes;

    // If student clicks submit again
    if (updates.submit) {
      student.status = "Pending";
      student.appliedAt = new Date();
    }

    await student.save();

    return res.json({
      success: true,
      message: "Updated successfully",
      student,
    });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ----------------------------------------------------------
   OFFICE ADMISSION APPROVAL
----------------------------------------------------------- */
export const officeAdmissionApprove = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: "Not found" });

    if (student.status === "Admitted") {
      return res.status(400).json({ error: "Already admitted" });
    }

    student.status = "Admitted";
    student.admittedAt = new Date();
    student.admissionNumber = generateAdmissionNumber(
      student.department,
      student.entryYear
    );

    student.officeAdmissionApprovedBy = req.user?.dbUserId;
    student.officeAdmissionApprovedAt = new Date();

    await student.save();

    return res.json({
      success: true,
      message: "Student admitted successfully",
      student,
    });
  } catch (err) {
    console.error("APPROVE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ----------------------------------------------------------
   REGISTRAR PROMOTION
----------------------------------------------------------- */
export const registrarPromoteStudent = async (req, res) => {
  try {
    const { newBatch } = req.body;
    const student = await Student.findById(req.params.id);

    if (!student) return res.status(404).json({ error: "Not found" });

    student.batch = newBatch;
    student.status = "Promoted";
    student.registrarUpdatedBy = req.user?.dbUserId;

    await student.save();

    return res.json({
      success: true,
      message: "Promoted successfully",
      student,
    });
  } catch (err) {
    console.error("PROMOTE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ----------------------------------------------------------
   GET SINGLE STUDENT
----------------------------------------------------------- */
export const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate("user");
    if (!student) return res.status(404).json({ error: "Not found" });

    return res.json({ success: true, student });
  } catch (err) {
    console.error("GET ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ----------------------------------------------------------
   LIST STUDENTS (FILTERS + SEARCH)
----------------------------------------------------------- */
export const listStudents = async (req, res) => {
  try {
    const {
      department,
      program,
      status,
      entryType,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (department) filter.department = department;
    if (program) filter.program = program;
    if (status) filter.status = status;
    if (entryType) filter.entryType = entryType;

    // Search by name, applicationNumber, admissionNumber
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { applicationNumber: regex },
        { admissionNumber: regex },
        { "identity.studentName": regex },
      ];
    }

    const students = await Student.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Student.countDocuments(filter);

    return res.json({
      success: true,
      students,
      total,
    });
  } catch (err) {
    console.error("LIST ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ----------------------------------------------------------
   DELETE STUDENT + DELETE CLOUD IMAGES
----------------------------------------------------------- */
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: "Not found" });

    // Delete Cloudinary files
    for (const doc of student.documents) {
      if (doc.publicId) {
        await cloudinary.uploader.destroy(doc.publicId);
      }
    }

    await Student.deleteOne({ _id: req.params.id });

    return res.json({
      success: true,
      message: "Student & documents deleted",
    });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
