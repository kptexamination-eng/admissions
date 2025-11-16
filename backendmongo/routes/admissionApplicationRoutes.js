import express from "express";
import {
  getAllAdmissions,
  getMyApplication,
  getAdmissionsForOffice,
  updateAdmissionStatus,
  getAdmissionCounts,
  downloadApplicationPdf,
  updateStatus,
  
  createAdmission,
  updateAdmission,
  uploadPhoto,
  deleteAdmission,
  getAdmission,
} from "../controllers/admissionApplicationController.js";

import { upload } from "../utils/multer.js";

const router = express.Router();

router.get("/my", getMyApplication);
router.get("/list-office", getAdmissionsForOffice);
router.put("/status/:id", updateAdmissionStatus);
router.get("/counts", getAdmissionCounts);
router.get("/pdf/:id", downloadApplicationPdf);
router.put("/update-status/:id", updateStatus);

router.post("/", upload.single("photo"), createAdmission);
router.get("/", getAllAdmissions);
router.get("/:id", getAdmission);
router.put("/:id", updateAdmission);
router.delete("/:id", deleteAdmission);

/* PRIVATE PHOTO UPLOAD */
router.put("/:id/photo", uploadPhoto);

export default router;
