import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import * as patientsController from "../controllers/patients.controller";
import { listPatientsQuerySchema, patientIdParamsSchema, updatePatientSchema } from "../validators/patient.validators";

const router = Router();

router.use(requireAuth);

router.get("/", validate(listPatientsQuerySchema), patientsController.listPatients);
router.patch("/:id", validate(updatePatientSchema), patientsController.updatePatient);
router.delete("/:id", validate(patientIdParamsSchema), patientsController.deletePatient);

export default router;
