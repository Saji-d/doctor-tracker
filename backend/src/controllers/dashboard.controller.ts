import { Request, Response, NextFunction } from "express";
import * as DashboardService from "../services/DashboardService";
import { DashboardSummaryQuery } from "../validators/dashboard.validators";

export async function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { range } = req.query as unknown as DashboardSummaryQuery;
    const summary = await DashboardService.getSummary(range);
    res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
}
