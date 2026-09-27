import { Router } from "express";
import {
  createAdminOpportunity,
  deleteAdminApplication,
  deleteAdminOpportunity,
  listAdminApplications,
  listAdminOpportunities,
  updateAdminApplicationStatus,
  updateAdminOpportunity,
} from "../controllers/admin.controller.js";
import { requireAdmin, requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import {
  createOpportunitySchema,
  applicationStatusSchema,
  updateOpportunitySchema,
} from "../schemas/admin.schema.js";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/opportunities", listAdminOpportunities);
router.post("/opportunities", validate(createOpportunitySchema), createAdminOpportunity);
router.patch("/opportunities/:id", validate(updateOpportunitySchema), updateAdminOpportunity);
router.delete("/opportunities/:id", deleteAdminOpportunity);
router.get("/applications", listAdminApplications);
router.patch("/applications/:id/status", validate(applicationStatusSchema), updateAdminApplicationStatus);
router.delete("/applications/:id", deleteAdminApplication);

export default router;
