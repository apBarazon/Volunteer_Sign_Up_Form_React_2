import { Router } from "express";
import { getApplications, submitApplication } from "../controllers/application.controller.js";
import { validate } from "../middleware/validate.js";
import { applicationSchema } from "../schemas/application.schema.js";

const router = Router();

router.get("/", getApplications);
router.post("/", validate(applicationSchema), submitApplication);

export default router;
