import { Router } from "express";
import { getApplications, submitApplication } from "../controllers/application.controller.js";

const router = Router();

router.get("/", getApplications);
router.post("/", submitApplication);

export default router;
