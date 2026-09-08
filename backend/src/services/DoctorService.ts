import { FilterQuery } from "mongoose";
import { Doctor, IDoctor, DoctorStatus } from "../models/Doctor";
import { Patient } from "../models/Patient";
import { ApiError } from "../utils/ApiError";
import { getPaginationMeta } from "../utils/pagination";

interface ListDoctorsParams {
  page: number;
  limit: number;
  search?: string;
  specialization?: string;
  hospital?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export async function listDoctors(params: ListDoctorsParams) {
  const { page, limit, search, specialization, hospital, dateFrom, dateTo } = params;

  const filter: FilterQuery<IDoctor> = {};
  if (search) filter.$text = { $search: search };
  if (specialization) filter.specialization = specialization;
  if (hospital) filter.hospital = hospital;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = dateFrom;
    if (dateTo) filter.createdAt.$lte = dateTo;
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Doctor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-__v").lean(),
    Doctor.countDocuments(filter),
  ]);

  // Bounded to just this page's doctors (at most `limit`, capped at 50 by
  // the validator) — one small aggregate, not a per-row query.
  const doctorIds = data.map((d) => d._id);
  const patientCounts = await Patient.aggregate([
    { $match: { doctorId: { $in: doctorIds } } },
    { $group: { _id: "$doctorId", count: { $sum: 1 } } },
  ]);
  const countByDoctorId = new Map(patientCounts.map((c) => [String(c._id), c.count as number]));
  const dataWithCounts = data.map((d) => ({ ...d, patientCount: countByDoctorId.get(String(d._id)) ?? 0 }));

  return { data: dataWithCounts, pagination: getPaginationMeta(page, limit, total) };
}

interface CreateDoctorInput {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
}

export async function createDoctor(input: CreateDoctorInput) {
  const email = input.email.toLowerCase();

  const existing = await Doctor.findOne({ email }).select("_id").lean();
  if (existing) {
    throw new ApiError(409, "CONFLICT", "A doctor with this email already exists");
  }

  const doctor = await Doctor.create({ ...input, email });
  return doctor.toObject();
}

export async function getDoctorById(id: string) {
  const doctor = await Doctor.findById(id).select("-__v").lean();
  if (!doctor) {
    throw new ApiError(404, "NOT_FOUND", "Doctor not found");
  }
  return doctor;
}

interface UpdateDoctorInput {
  name?: string;
  specialization?: string;
  hospital?: string;
  phone?: string;
  email?: string;
  status?: DoctorStatus;
}

export async function updateDoctor(id: string, input: UpdateDoctorInput) {
  let update = input;
  if (input.email) {
    const email = input.email.toLowerCase();
    const existing = await Doctor.findOne({ email, _id: { $ne: id } }).select("_id").lean();
    if (existing) {
      throw new ApiError(409, "CONFLICT", "A doctor with this email already exists");
    }
    update = { ...input, email };
  }

  const doctor = await Doctor.findByIdAndUpdate(id, update, { new: true, runValidators: true })
    .select("-__v")
    .lean();
  if (!doctor) {
    throw new ApiError(404, "NOT_FOUND", "Doctor not found");
  }
  return doctor;
}

export async function deleteDoctor(id: string) {
  // Patients reference doctors via Patient.doctorId (the "many" side owns the
  // FK — see Patient model) — there's no cascade-delete story for that, so a
  // doctor with patients still assigned can't be deleted without either
  // orphaning or silently reassigning them, neither of which this endpoint
  // does. The caller has to clear the doctor's patients first.
  const patientCount = await Patient.countDocuments({ doctorId: id });
  if (patientCount > 0) {
    throw new ApiError(
      409,
      "CONFLICT",
      `Cannot delete this doctor — ${patientCount} patient${patientCount === 1 ? "" : "s"} still assigned. Reassign or delete them first.`
    );
  }

  const doctor = await Doctor.findByIdAndDelete(id).lean();
  if (!doctor) {
    throw new ApiError(404, "NOT_FOUND", "Doctor not found");
  }
}
