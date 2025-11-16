import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

const { Schema, model, Types } = mongoose;

/* ---------------------------------------------
   ADDRESS SCHEMA
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
   COURSE OPTION
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
  "Approved",
  "NotAllotted",
  "Admitted",
  "Rejected",
  "Withdrawn",
];

const entryTypeEnum = ["SSLC", "PU", "ITI", "LATERAL-PU", "LATERAL-ITI"];

/* ---------------------------------------------
   MAIN ADMISSION APPLICATION SCHEMA
---------------------------------------------- */
const admissionApplicationSchema = new Schema(
  {
    /* USER / CLERK */
    user: { type: Types.ObjectId, ref: "User", required: true },
    clerkId: { type: String, required: true },

    /* ADMISSION METADATA */
    applicationNumber: { type: String, index: true },
    admissionNumber: { type: String, index: true, sparse: true },

    entryType: { type: String, enum: entryTypeEnum, required: true },
    entryYear: { type: Number, required: true },

    program: { type: String, required: true }, // Diploma

    status: { type: String, enum: admissionStatusEnum, default: "Draft" },
    appliedAt: Date,
    admittedAt: Date,

    /* IDENTITY */
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

    /* STUDY DETAILS */
    studyDetails: {
      qualifyingExam: String,
      nativeStateCode: String,
      nativeDistrictCode: String,
      karnatakaStudyYears: Number,

      studiedInRural: Boolean,
      studiedInKannadaMedium: Boolean,

      studyExemption: Boolean,
      exemptionClauseCode: String,

      specialCategory: [String],
      hydKarQuota: Boolean,
      snqQuota: Boolean,

      categoryCode: String,
      casteName: String,
      parentAnnualIncome: Number,
    },

    /* MARKS */
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

    /* CONTACT */
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

    /* PARENTS */
    parents: [parentSchema],

    /* COURSE OPTIONS */
    courseOptions: [courseOptionSchema],

    /* SINGLE PHOTO UPLOAD */
    photo: {
      url: String,
      publicId: String,
    },

    /* WORKFLOW */
    createdBy: { type: Types.ObjectId, ref: "User" },
    officeAdmissionApprovedBy: { type: Types.ObjectId, ref: "User" },
    officeAdmissionApprovedAt: Date,
    registrarUpdatedBy: { type: Types.ObjectId, ref: "User" },

    notes: String,
  },
  { timestamps: true }
);

/* ---------------------------------------------
   INDEXES
---------------------------------------------- */
admissionApplicationSchema.index({ applicationNumber: 1 });
admissionApplicationSchema.index({ admissionNumber: 1 });
admissionApplicationSchema.index({ program: 1, status: 1 });

/* ---------------------------------------------
   DELETE PHOTO FROM CLOUDINARY WHEN RECORD DELETED
---------------------------------------------- */
admissionApplicationSchema.pre("findOneAndDelete", async function (next) {
  try {
    const doc = await this.model.findOne(this.getFilter());

    if (!doc?.photo?.publicId) {
      return next();
    }

    await cloudinary.uploader.destroy(doc.photo.publicId, {
      type: "private",
      resource_type: "image",
    });

    console.log("Cloudinary private photo deleted:", doc.photo.publicId);

    next();
  } catch (err) {
    console.error("Cloudinary delete failed:", err);
    next(); // continue deletion even if Cloudinary fails
  }
});

export default model("AdmissionApplication", admissionApplicationSchema);
