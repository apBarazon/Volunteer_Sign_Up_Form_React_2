import { Router } from "express";
import { signup } from "../controllers/volunteer.controller.js";
import { validate } from "../middleware/validate.js";
import { volunteerSignupSchema } from "../schemas/volunteer.schema.js";

const router = Router();

router.post("/signup", validate(volunteerSignupSchema), signup);

export default router;
