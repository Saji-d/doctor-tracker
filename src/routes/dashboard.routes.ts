import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import * as dashboardController from "../controllers/dashboard.controller";
import { dashboardSummaryQuerySchema } from "../validators/dashboard.validators";

const router = Router();

router.use(requireAuth);

router.get("/summary", validate(dashboardSummaryQuerySchema), dashboardController.getSummary);

export default router;
