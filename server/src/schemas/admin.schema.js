import { z } from "zod";

// Optional image URL: blank clears it (stored as NULL), otherwise it must be an http(s) URL.
const imageUrlField = z
  .string()
  .trim()
  .max(255, "Image URL is too long (255 characters max).")
  .refine(
    (value) => value === "" || /^https?:\/\/\S+$/i.test(value),
    "Image URL must start with http:// or https://",
  )
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

const opportunityFields = {
  name: z.string().trim().min(1, "Name is required.").max(150, "Name is too long."),
  type: z.string().trim().min(1, "Type is required.").max(50, "Type is too long."),
  description: z.string().trim().max(2000, "Description is too long."),
  spotsLeft: z.coerce.number().int().min(0, "Spots cannot be negative."),
  imageUrl: imageUrlField,
};

export const createOpportunitySchema = z.object(opportunityFields);
export const updateOpportunitySchema = z
  .object(opportunityFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

export const applicationStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});