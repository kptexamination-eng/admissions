// models/User.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    clerkId: { type: String, index: true, sparse: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: [
        "Admin",
        "Principal",
        "Registrar",
        "COE",
        "AssistantCOE",
        "ChairmanOfExams",
        "OfficeExam",
        "office-admissions",
        "OfficeFee",
        "HOD",
        "Staff",
        "MarkEntryCaseWorker",
        "Student",
      ],
      default: "Student",
    },
    department: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model("User", userSchema);
