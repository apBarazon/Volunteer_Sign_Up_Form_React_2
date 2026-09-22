import { z } from "zod";

export const volunteerSignupSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  eventId: z
    .number({ invalid_type_error: "Please select an event" })
    .int()
    .positive(),
});