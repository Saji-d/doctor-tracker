import { FilterQuery } from "mongoose";
import { Patient, IPatient } from "../models/Patient";
import { ApiError } from "../utils/ApiError";
import { getPaginationMeta } from "../utils/pagination";
import * as DoctorService from "./DoctorService";

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

interface CreateInput {
  name: string;
  age: number;
  condition: string;
  phone?: string;
  doctorId: string;
}

export async function create(input: CreateInput) {
  await DoctorService.getDoctorById(input.doctorId);

  const patient = await Patient.create(input);
  return patient.toObject();
}

interface ListPatientsParams {
  page: number;
  limit: number;
  search?: string;
  condition?: string;
  doctorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export async function listAll(params: ListPatientsParams) {
  const { page, limit, search, condition, doctorId, dateFrom, dateTo } = params;

  const filter: FilterQuery<IPatient> = {};
  if (search) filter.$text = { $search: search };
  if (condition) filter.condition = condition;
  if (doctorId) filter.doctorId = doctorId;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = dateFrom;
    if (dateTo) filter.createdAt.$lte = dateTo;
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Patient.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-__v").lean(),
    Patient.countDocuments(filter),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

interface UpdatePatientInput {
  name?: string;
  age?: number;
  condition?: string;
  phone?: string;
  doctorId?: string;
}

export async function updateById(id: string, input: UpdatePatientInput) {
  if (input.doctorId) {
    await DoctorService.getDoctorById(input.doctorId);
  }

  const patient = await Patient.findByIdAndUpdate(id, input, { new: true, runValidators: true })
    .select("-__v")
    .lean();
  if (!patient) {
    throw new ApiError(404, "NOT_FOUND", "Patient not found");
  }
  return patient;
}

export async function deleteById(id: string) {
  const patient = await Patient.findByIdAndDelete(id).lean();
  if (!patient) {
    throw new ApiError(404, "NOT_FOUND", "Patient not found");
  }
}
