// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { clerkMiddleware } from "@clerk/express";

import connectDB from "./config/db.js";
import "./config/cloudinary.js"; // auto-runs cloudinary config
import studentRoutes from "./routes/studentsRoutes.js";
import admissionApplicationRoutes from "./routes/admissionApplicationRoutes.js";

const app = express();

// ---------------------------
// Global Middlewares
// ---------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(clerkMiddleware());
// ---------------------------
// Database Connection
// ---------------------------
connectDB();

app.use("/api/students", studentRoutes);
app.use("/api/admission-applications", admissionApplicationRoutes);
// ---------------------------
// Start Server
// ---------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
