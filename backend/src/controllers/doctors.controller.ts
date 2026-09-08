import { Request, Response, NextFunction } from "express";
import * as DoctorService from "../services/DoctorService";
import * as PatientService from "../services/PatientService";
import {
  CreateDoctorBody,
  ListDoctorsQuery,
  ListDoctorPatientsQuery,
  CreatePatientUnderDoctorBody,
  UpdateDoctorBody,
} from "../validators/doctor.validators";

export async function listDoctors(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, search, specialization, hospital, dateFrom, dateTo } =
      req.query as unknown as ListDoctorsQuery;
    const result = await DoctorService.listDoctors({ page, limit, search, specialization, hospital, dateFrom, dateTo });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createDoctor(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as CreateDoctorBody;
    const doctor = await DoctorService.createDoctor(body);
    res.status(201).json(doctor);
  } catch (err) {
    next(err);
  }
}

export async function getDoctor(req: Request, res: Response, next: NextFunction) {
  try {
    const doctor = await DoctorService.getDoctorById(req.params.id);
    res.status(200).json(doctor);
  } catch (err) {
    next(err);
  }
}

export async function updateDoctor(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as UpdateDoctorBody;
    const doctor = await DoctorService.updateDoctor(req.params.id, body);
    res.status(200).json(doctor);
  } catch (err) {
    next(err);
  }
}

export async function deleteDoctor(req: Request, res: Response, next: NextFunction) {
  try {
    await DoctorService.deleteDoctor(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listDoctorPatients(req: Request, res: Response, next: NextFunction) {
  try {
    await DoctorService.getDoctorById(req.params.id);
    const { page, limit } = req.query as unknown as ListDoctorPatientsQuery;
    const result = await PatientService.listByDoctor(req.params.id, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createDoctorPatient(req: Request, res: Response, next: NextFunction) {
  try {
    await DoctorService.getDoctorById(req.params.id);
    const body = req.body as CreatePatientUnderDoctorBody;
    const patient = await PatientService.createForDoctor(req.params.id, body);
    res.status(201).json(patient);
  } catch (err) {
    next(err);
  }
}
