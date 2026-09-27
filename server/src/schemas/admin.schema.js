import { z } from "zod";

const opportunityFields = {
  name: z.string().trim().min(1, "Name is required.").max(150, "Name is too long."),
  type: z.string().trim().min(1, "Type is required.").max(50, "Type is too long."),
  description: z.string().trim().max(2000, "Description is too long."),
  spotsLeft: z.coerce.number().int().min(0, "Spots cannot be negative."),
};

export const createOpportunitySchema = z.object(opportunityFields);
export const updateOpportunitySchema = z
  .object(opportunityFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");
