import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import * as doctorsController from "../controllers/doctors.controller";
import {
  createDoctorSchema,
  listDoctorsQuerySchema,
  doctorIdParamsSchema,
  updateDoctorSchema,
  listDoctorPatientsQuerySchema,
  createPatientUnderDoctorSchema,
} from "../validators/doctor.validators";

const router = Router();

router.use(requireAuth);

router.get("/", validate(listDoctorsQuerySchema), doctorsController.listDoctors);
router.post("/", validate(createDoctorSchema), doctorsController.createDoctor);
router.get("/:id", validate(doctorIdParamsSchema), doctorsController.getDoctor);
router.patch("/:id", validate(updateDoctorSchema), doctorsController.updateDoctor);
router.delete("/:id", validate(doctorIdParamsSchema), doctorsController.deleteDoctor);
router.get("/:id/patients", validate(listDoctorPatientsQuerySchema), doctorsController.listDoctorPatients);
router.post("/:id/patients", validate(createPatientUnderDoctorSchema), doctorsController.createDoctorPatient);

export default router;
