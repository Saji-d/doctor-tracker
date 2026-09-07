import { FilterQuery } from "mongoose";
import { Doctor, IDoctor } from "../models/Doctor";
import { ApiError } from "../utils/ApiError";
import { getPaginationMeta } from "../utils/pagination";

interface ListDoctorsParams {
  page: number;
  limit: number;
  search?: string;
  specialization?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export async function listDoctors(params: ListDoctorsParams) {
  const { page, limit, search, specialization, dateFrom, dateTo } = params;

  const filter: FilterQuery<IDoctor> = {};
  if (search) filter.$text = { $search: search };
  if (specialization) filter.specialization = specialization;
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

  return { data, pagination: getPaginationMeta(page, limit, total) };
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
