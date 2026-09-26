import { Router } from "express";
import { getOpportunities, getOpportunityById } from "../controllers/opportunity.controller.js";

const router = Router();

router.get("/", getOpportunities);
router.get("/:id", getOpportunityById);

export default router;
