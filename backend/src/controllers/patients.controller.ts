import { Request, Response, NextFunction } from "express";
import * as PatientService from "../services/PatientService";
import { ListPatientsQuery, UpdatePatientBody } from "../validators/patient.validators";

export async function listPatients(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, search, condition, doctorId, dateFrom, dateTo } =
      req.query as unknown as ListPatientsQuery;
    const result = await PatientService.listAll({ page, limit, search, condition, doctorId, dateFrom, dateTo });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updatePatient(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as UpdatePatientBody;
    const patient = await PatientService.updateById(req.params.id, body);
    res.status(200).json(patient);
  } catch (err) {
    next(err);
  }
}

export async function deletePatient(req: Request, res: Response, next: NextFunction) {
  try {
    await PatientService.deleteById(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
