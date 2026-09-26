import { Router } from "express";
import { getApplications, submitApplication } from "../controllers/application.controller.js";
import { validate } from "../middleware/validate.js";
import { applicationSchema } from "../schemas/application.schema.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/", requireAuth, getApplications);
router.post("/", requireAuth, validate(applicationSchema), submitApplication);

export default router;
