import { z } from "zod";

export const volunteerSignupSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address (e.g. name@example.com)"),
  phone: z
    .string()
    .regex(/^[\d\s\-+()]{7,20}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  eventId: z
    .coerce
    .number({ invalid_type_error: "Please select an event" })
    .int()
    .positive("Please select an event"),
});

