import { z } from "zod";

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

// Accepts both local and international formats, including Bangladesh's
// +880 mobile format already used throughout the seeded demo data.
export const phoneRegex = /^\+?[0-9\s]{7,15}$/;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

function optionalDateField() {
  return z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Date.parse(v)), "Invalid date")
    .transform((v) => (v ? new Date(v) : undefined));
}

export const dateRangeQuerySchema = z.object({
  dateFrom: optionalDateField(),
  dateTo: optionalDateField(),
});
