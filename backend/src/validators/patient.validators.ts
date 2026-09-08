import { z } from "zod";
import { objectIdSchema, paginationQuerySchema, dateRangeQuerySchema, phoneRegex } from "./common";

export const listPatientsQuerySchema = z.object({
  query: paginationQuerySchema
    .extend({
      search: z.string().trim().optional(),
      condition: z.string().trim().optional(),
      doctorId: objectIdSchema.optional(),
    })
    .merge(dateRangeQuerySchema),
});

export const patientIdParamsSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const createPatientSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").trim(),
    age: z.coerce.number().int().min(0).max(150),
    condition: z.string().min(1, "Condition is required").trim(),
    phone: z.string().trim().min(1, "Phone number is required").regex(phoneRegex, "Invalid phone number"),
    doctorId: objectIdSchema,
  }),
});

export const updatePatientSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z
    .object({
      name: z.string().min(1, "Name is required").trim(),
      age: z.coerce.number().int().min(0).max(150),
      condition: z.string().min(1, "Condition is required").trim(),
      doctorId: objectIdSchema,
    })
    .partial()
    .extend({
      phone: z.string().trim().min(1, "Phone number is required").regex(phoneRegex, "Invalid phone number"),
    })
    .refine((data) => Object.keys(data).length > 0, "At least one field must be provided"),
});

export type ListPatientsQuery = z.infer<typeof listPatientsQuerySchema>["query"];
export type CreatePatientBody = z.infer<typeof createPatientSchema>["body"];
export type UpdatePatientBody = z.infer<typeof updatePatientSchema>["body"];
