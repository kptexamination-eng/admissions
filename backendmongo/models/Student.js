import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

/* ---------------------------------------------
   ADDRESS SCHEMA — Permanent & Current
---------------------------------------------- */
const addressSchema = new Schema({
  line1: String,
  line2: String,
  city: String,
  state: String,
  country: { type: String, default: "India" },
  pincode: String,
});

/* ---------------------------------------------
   PARENT / GUARDIAN
---------------------------------------------- */
const parentSchema = new Schema({
  name: { type: String, required: true },
  relationship: { type: String, default: "Parent" },
  phone: String,
  email: String,
  occupation: String,
});

/* ---------------------------------------------
   COURSE PREFERENCE (Priority No)
---------------------------------------------- */
const courseOptionSchema = new Schema({
  priorityNumber: Number,
  courseName: String,
  instituteCode: String,
  collegeName: String,
});

/* ---------------------------------------------
   ENUMS
---------------------------------------------- */
const admissionStatusEnum = [
  "Draft",
  "Pending",
  "Admitted",
  "Rejected",
  "Withdrawn",
  "Promoted",
  "Alumni",
];

const entryTypeEnum = ["SSLC", "PU", "ITI", "LATERAL-PU", "LATERAL-ITI"];

/* ---------------------------------------------
   MAIN STUDENT SCHEMA
---------------------------------------------- */
const studentSchema = new Schema(
  {
    /* --------------------------
       USER LINK + CLERK
    --------------------------- */
    user: { type: Types.ObjectId, ref: "User", required: true },
    clerkId: { type: String, required: true },

    /* --------------------------
       ADMISSION METADATA
    --------------------------- */
    applicationNumber: { type: String, index: true },
    admissionNumber: { type: String, index: true, sparse: true },

    entryType: { type: String, enum: entryTypeEnum, required: true },
    entryYear: { type: Number, required: true },

    program: { type: String, required: true }, // Diploma
    department: { type: String, required: true },
    branch: String,
    batch: String,

    status: { type: String, enum: admissionStatusEnum, default: "Draft" },
    appliedAt: Date,
    admittedAt: Date,

    /* --------------------------
       IDENTITY (PDF Fields)
    --------------------------- */
    identity: {
      satsNo: String,
      aadharNo: String,
      studentName: String,
      motherName: String,
      fatherName: String,
      dob: String,
      gender: String,
      nationality: String,
      religion: String,
    },

    /* --------------------------
       STUDY DETAILS (PDF)
    --------------------------- */
    studyDetails: {
      qualifyingExam: String, // SSLC / CBSE / ICSE / OTHER
      nativeStateCode: String,
      nativeDistrictCode: String,
      karnatakaStudyYears: Number,

      studiedInRural: Boolean,
      studiedInKannadaMedium: Boolean,

      studyExemption: Boolean,
      exemptionClauseCode: String,

      specialCategory: [String], // NCC, JTS, PH, etc
      hydKarQuota: Boolean,
      snqQuota: Boolean,

      categoryCode: String,
      casteName: String,
      parentAnnualIncome: Number,
    },

    /* --------------------------
       MARKS (PDF)
    --------------------------- */
    marks: {
      sslcRegisterNumber: String,
      sslcPassYear: Number,

      totalMaxMarks: Number,
      totalMarksObtained: Number,

      scienceMax: Number,
      scienceObtained: Number,

      mathsMax: Number,
      mathsObtained: Number,

      totalScienceMathsMax: Number,
      totalScienceMathsObtained: Number,
    },

    /* --------------------------
       CONTACT (PDF)
       + Permanent + Current Address (College Requirement)
    --------------------------- */
    contact: {
      studentMobile: String,
      parentMobile: String,
      email: String,

      postalAddress: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
      },
    },

    permanentAddress: addressSchema,
    currentAddress: addressSchema,

    /* --------------------------
       PARENTS
    --------------------------- */
    parents: [parentSchema],

    /* --------------------------
       COURSE OPTIONS (PDF)
    --------------------------- */
    courseOptions: [courseOptionSchema],

    /* --------------------------
       DOCUMENTS (Cloudinary)
    --------------------------- */
    documents: [
      {
        url: String,
        publicId: String,
        docType: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    /* --------------------------
       WORKFLOW FIELDS
    --------------------------- */
    createdBy: { type: Types.ObjectId, ref: "User" },

    officeAdmissionApprovedBy: { type: Types.ObjectId, ref: "User" },
    officeAdmissionApprovedAt: Date,

    registrarUpdatedBy: { type: Types.ObjectId, ref: "User" },

    notes: String,
  },
  { timestamps: true }
);

/* --------------------------
   INDEXES
--------------------------- */
studentSchema.index({ admissionNumber: 1 });
studentSchema.index({ applicationNumber: 1 });
studentSchema.index({ department: 1, program: 1, status: 1 });

export default model("Student", studentSchema);
