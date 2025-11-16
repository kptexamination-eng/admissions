import express from "express";
import {
  createStudentApplication,
  updateStudentApplication,
  officeAdmissionApprove,
  registrarPromoteStudent,
  getStudent,
  listStudents,
  deleteStudent,
} from "../controllers/studentController.js";
import { requireAuthWithRole } from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/",
  ...requireAuthWithRole(["admissions-application-entry"]),
  createStudentApplication
);

router.put("/:id", ...requireAuthWithRole([]), updateStudentApplication);

router.post(
  "/approve/:id",
  ...requireAuthWithRole(["office-admissions"]),
  officeAdmissionApprove
);

router.post(
  "/promote/:id",
  ...requireAuthWithRole(["Registrar"]),
  registrarPromoteStudent
);

router.get("/:id", ...requireAuthWithRole([]), getStudent);

router.get(
  "/",
  ...requireAuthWithRole([
    "Admin",
    "office-admissions",
    "Registrar",
    "Principal",
    "COE",
  ]),
  listStudents
);

router.delete("/:id", ...requireAuthWithRole(["Admin"]), deleteStudent);

export default router;
