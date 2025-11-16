// controllers/admissionApplicationController.js
import AdmissionApplication from "../models/AdmissionApplication.js";
import User from "../models/User.js";
import cloudinary from "../utils/cloudinary.js";
import PDFDocument from "pdfkit";

/* ============================================================
   CREATE ADMISSION — ONE APPLICATION PER USER
============================================================ */
export const createAdmission = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "Photo is required" });
    }

    /* ---------------------------------------------------------
       STEP 1 → Extract Clerk ID (string from frontend)
    ---------------------------------------------------------- */
    const clerkId = req.body.clerkId;
    if (!clerkId) {
      return res.status(400).json({
        success: false,
        message: "clerkId missing in form-data",
      });
    }

    /* ---------------------------------------------------------
       STEP 2 → BLOCK DUPLICATE APPLICATIONS
    ---------------------------------------------------------- */
    const existingApp = await AdmissionApplication.findOne({ clerkId });
    if (existingApp) {
      return res.status(400).json({
        success: false,
        message:
          "You have already submitted an application. Editing is allowed, but creating another application is not.",
      });
    }

    /* ---------------------------------------------------------
       STEP 3 → Find or Create Mongo User
    ---------------------------------------------------------- */
    let mongoUser = await User.findOne({ clerkId: clerkId });

    if (!mongoUser) {
      mongoUser = await User.create({
        clerkId,
        email: req.body.email || "",
        name: req.body.name || "Unknown User",
        role: "Student",
      });
    }

    /* ---------------------------------------------------------
       STEP 4 → UPLOAD PRIVATE PHOTO TO CLOUDINARY
    ---------------------------------------------------------- */
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "admission_photos",
        type: "private",
        resource_type: "image",
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ success: false, error });
        }

        /* ---------------------------------------------------------
           STEP 5 → Parse JSON fields from FormData
        ---------------------------------------------------------- */
        const parsedData = {};
        Object.keys(req.body).forEach((key) => {
          if (["clerkId", "user"].includes(key)) return;
          try {
            parsedData[key] = JSON.parse(req.body[key]);
          } catch {
            parsedData[key] = req.body[key];
          }
        });

        /* ---------------------------------------------------------
           STEP 6 → Attach References
        ---------------------------------------------------------- */
        parsedData.user = mongoUser._id;
        parsedData.clerkId = clerkId;
        parsedData.photo = {
          url: result.secure_url,
          publicId: result.public_id,
        };

        // OPTIONAL: mark the application as submitted
        parsedData.status = "Draft"; // or "Pending" if submission = final
        parsedData.appliedAt = new Date();

        /* ---------------------------------------------------------
           STEP 7 → Save Application
        ---------------------------------------------------------- */
        const newApp = await AdmissionApplication.create(parsedData);

        res.status(201).json({
          success: true,
          message: "Application submitted successfully",
          data: newApp,
        });
      }
    );

    uploadStream.end(file.buffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ============================================================
   UPDATE ADMISSION — ALLOWED ONLY IF STATUS = "Draft"
============================================================ */
export const updateAdmission = async (req, res) => {
  try {
    const app = await AdmissionApplication.findById(req.params.id);

    if (!app)
      return res.status(404).json({ success: false, message: "Not found" });

    if (app.status !== "Draft") {
      return res.status(403).json({
        success: false,
        message:
          "Application cannot be edited after submission process begins.",
      });
    }

    const updated = await AdmissionApplication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      message: "Application updated successfully",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ============================================================
   UPLOAD PHOTO (PRIVATE MODE)
============================================================ */
export const uploadPhoto = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "No photo uploaded" });
    }

    const app = await AdmissionApplication.findById(req.params.id);
    if (!app)
      return res.status(404).json({ success: false, message: "Not found" });

    // Delete old photo
    if (app.photo?.publicId) {
      await cloudinary.uploader.destroy(app.photo.publicId, {
        type: "private",
        resource_type: "image",
      });
    }

    // Upload new photo
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "admission_photos",
        type: "private",
        resource_type: "image",
      },
      async (error, result) => {
        if (error) return res.status(500).json({ success: false, error });

        app.photo = {
          url: result.secure_url,
          publicId: result.public_id,
        };

        await app.save();

        res.json({
          success: true,
          message: "Photo updated successfully",
          data: app.photo,
        });
      }
    );

    uploadStream.end(file.buffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ============================================================
   DELETE ADMISSION
============================================================ */
export const deleteAdmission = async (req, res) => {
  try {
    await AdmissionApplication.findOneAndDelete({ _id: req.params.id });

    res.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ============================================================
   GET SINGLE ADMISSION
============================================================ */
export const getAdmission = async (req, res) => {
  try {
    const app = await AdmissionApplication.findById(req.params.id);
    res.json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ============================================================
   GET ALL WITH FILTERS
============================================================ */
export const getAllAdmissions = async (req, res) => {
  try {
    const { status, program, search } = req.query;

    const query = {};

    if (status) query.status = status;
    if (program) query.program = program;

    if (search) {
      query["identity.studentName"] = { $regex: search, $options: "i" };
    }

    const apps = await AdmissionApplication.find(query).sort({
      createdAt: -1,
    });

    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getMyApplication = async (req, res) => {
  try {
    const clerkId = req.auth.userId;

    const app = await AdmissionApplication.findOne({ clerkId });

    res.json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getAdmissionsForOffice = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = {};

    if (status) query.status = status;

    if (search) {
      query["identity.studentName"] = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const data = await AdmissionApplication.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await AdmissionApplication.countDocuments(query);

    res.json({ success: true, data, total });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateAdmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Admitted", "Rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const app = await AdmissionApplication.findById(id);

    if (!app)
      return res.status(404).json({ success: false, message: "Not found" });

    app.status = status;

    if (status === "Admitted") {
      app.appliedAt = new Date();
    }

    await app.save();

    return res.json({
      success: true,
      message: `Application ${status}`,
      data: app,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = [
      "Draft",
      "Pending",
      "Approved",
      "NotAllotted",
      "Admitted",
      "Rejected",
      "Withdrawn",
    ];
    if (!allowed.includes(status))
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });

    const app = await AdmissionApplication.findById(req.params.id);
    if (!app)
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });

    // TODO: Insert auth checks here:
    // Example:
    // if (req.user.role === "Student") { only allow owner => status = "Pending" }
    // if (req.user.role === "office-admissions") { allow Approved/NotAllotted/Admitted/Rejected/Withdrawn }

    // Simple ownership check when student calls (if you send clerkId in body)
    // if (status === "Pending" && req.body.clerkId && req.body.clerkId !== app.clerkId) {
    //   return res.status(403).json({ success: false, message: "Not authorized" });
    // }

    // set timestamps for applied/admitted if relevant
    const update = { status };
    if (status === "Pending" && !app.appliedAt) update.appliedAt = new Date();
    if (status === "Admitted" && !app.admittedAt)
      update.admittedAt = new Date();

    const updated = await AdmissionApplication.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    return res.json({
      success: true,
      message: "Status updated",
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getAdmissionCounts = async (req, res) => {
  try {
    const drafts = await AdmissionApplication.countDocuments({
      status: "Draft",
    });
    const pending = await AdmissionApplication.countDocuments({
      status: "Pending",
    });
    const approved = await AdmissionApplication.countDocuments({
      status: "Approved",
    });
    const notAllotted = await AdmissionApplication.countDocuments({
      status: "NotAllotted",
    });
    const admitted = await AdmissionApplication.countDocuments({
      status: "Admitted",
    });
    const rejected = await AdmissionApplication.countDocuments({
      status: "Rejected",
    });
    const withdrawn = await AdmissionApplication.countDocuments({
      status: "Withdrawn",
    });

    const total =
      drafts +
      pending +
      approved +
      notAllotted +
      admitted +
      rejected +
      withdrawn;
    const applied = total - drafts; // everything except Draft

    return res.json({
      success: true,
      data: {
        drafts,
        pending,
        approved,
        notAllotted,
        admitted,
        rejected,
        withdrawn,
        applied,
        total,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const downloadApplicationPdf = async (req, res) => {
  try {
    const app = await AdmissionApplication.findById(req.params.id);

    if (!app) return res.status(404).json({ success: false });

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=application_${app._id}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(20).text("Admission Application", { underline: true });

    doc.moveDown().fontSize(14).text(`Student: ${app.identity.studentName}`);
    doc.text(`Program: ${app.program}`);
    doc.text(`Entry Type: ${app.entryType}`);
    doc.text(`Entry Year: ${app.entryYear}`);
    doc.text(`Status: ${app.status}`);

    doc.moveDown().text("=== Identity ===");
    Object.keys(app.identity).forEach((key) =>
      doc.text(`${key}: ${app.identity[key]}`)
    );

    doc.moveDown().text("=== Study Details ===");
    Object.keys(app.studyDetails).forEach((key) =>
      doc.text(`${key}: ${app.studyDetails[key]}`)
    );

    doc.moveDown().text("=== Marks ===");
    Object.keys(app.marks).forEach((key) =>
      doc.text(`${key}: ${app.marks[key]}`)
    );

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
