import { Patient } from "../models/Patient";
import { getPaginationMeta } from "../utils/pagination";

// NOTE: this service currently only covers what the doctors routes need
// (viewing and adding a doctor's patients). Full patient CRUD (global list,
// edit, delete, search/condition/date filters) is added in Phase 5.

export async function listByDoctor(doctorId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Patient.find({ doctorId }).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-__v").lean(),
    Patient.countDocuments({ doctorId }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

interface CreateForDoctorInput {
  name: string;
  age: number;
  condition: string;
  phone?: string;
}

export async function createForDoctor(doctorId: string, input: CreateForDoctorInput) {
  const patient = await Patient.create({ ...input, doctorId });
  return patient.toObject();
}
