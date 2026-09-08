import { z } from "zod";
import { objectIdSchema, paginationQuerySchema, dateRangeQuerySchema, phoneRegex } from "./common";

export const createDoctorSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").trim(),
    specialization: z.string().min(1, "Specialization is required").trim(),
    hospital: z.string().min(1, "Hospital is required").trim(),
    phone: z.string().regex(phoneRegex, "Invalid phone number"),
    email: z.string().email("Invalid email address"),
  }),
});

export const listDoctorsQuerySchema = z.object({
  query: paginationQuerySchema
    .extend({
      search: z.string().trim().optional(),
      specialization: z.string().trim().optional(),
      hospital: z.string().trim().optional(),
    })
    .merge(dateRangeQuerySchema),
});

export const doctorIdParamsSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const updateDoctorSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z
    .object({
      name: z.string().min(1, "Name is required").trim(),
      specialization: z.string().min(1, "Specialization is required").trim(),
      hospital: z.string().min(1, "Hospital is required").trim(),
      email: z.string().email("Invalid email address"),
      status: z.enum(["active", "on-leave", "inactive"]),
    })
    .partial()
    .extend({
      phone: z.string().trim().min(1, "Phone number is required").regex(phoneRegex, "Invalid phone number"),
    })
    .refine((data) => Object.keys(data).length > 0, "At least one field must be provided"),
});

export const listDoctorPatientsQuerySchema = z.object({
  params: z.object({ id: objectIdSchema }),
  query: paginationQuerySchema,
});

export const createPatientUnderDoctorSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    name: z.string().min(1, "Name is required").trim(),
    age: z.coerce.number().int().min(0).max(150),
    condition: z.string().min(1, "Condition is required").trim(),
    phone: z.string().trim().min(1, "Phone number is required").regex(phoneRegex, "Invalid phone number"),
  }),
});

export type CreateDoctorBody = z.infer<typeof createDoctorSchema>["body"];
export type UpdateDoctorBody = z.infer<typeof updateDoctorSchema>["body"];
export type ListDoctorsQuery = z.infer<typeof listDoctorsQuerySchema>["query"];
export type ListDoctorPatientsQuery = z.infer<typeof listDoctorPatientsQuerySchema>["query"];
export type CreatePatientUnderDoctorBody = z.infer<typeof createPatientUnderDoctorSchema>["body"];
