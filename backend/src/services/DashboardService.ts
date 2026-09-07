import { Doctor } from "../models/Doctor";
import { Patient } from "../models/Patient";

export interface PatientsPerDoctorEntry {
  doctorId: string;
  name: string;
  count: number;
}

export interface DateTrendEntry {
  date: string;
  count: number;
}

export interface ConditionBreakdownEntry {
  condition: string;
  count: number;
}

export interface DashboardSummary {
  totalDoctors: number;
  totalPatients: number;
  patientsPerDoctor: PatientsPerDoctorEntry[];
  dateTrend: DateTrendEntry[];
  conditionBreakdown: ConditionBreakdownEntry[];
}

function parseRangeDays(range: string): number {
  const match = /^(\d+)d$/.exec(range);
  return match ? parseInt(match[1], 10) : 30;
}

// Deliberately NOT one $facet pipeline: $facet's inner stages can't use an
// index, which would force dateTrend's $match to give up the createdAt
// index it gets by being a standalone pipeline's leading stage. Four small,
// independently-optimal queries in parallel are both simpler and faster
// than one pipeline built to look clever. totalPatients/patientsPerDoctor
// are intentionally scoped to ALL patients, not the selected range — only
// dateTrend respects `range`.
export async function getSummary(range: string): Promise<DashboardSummary> {
  const days = parseRangeDays(range);
  const rangeStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalDoctors, totalPatients, patientsPerDoctorRaw, dateTrendRaw, conditionBreakdownRaw] = await Promise.all([
    Doctor.countDocuments(),
    Patient.countDocuments(),
    Patient.aggregate([
      { $group: { _id: "$doctorId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: "doctors", localField: "_id", foreignField: "_id", as: "doctor" } },
      { $unwind: "$doctor" },
      { $project: { doctorId: "$_id", name: "$doctor.name", count: 1, _id: 0 } },
    ]),
    Patient.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // Same shape/tradeoff as patientsPerDoctor above: a $group over the whole
    // collection can't use an index (nothing indexes "group by condition"),
    // which is fine at this project's scale — same accepted tradeoff, not a
    // new one.
    Patient.aggregate([
      { $group: { _id: "$condition", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
      { $project: { condition: "$_id", count: 1, _id: 0 } },
    ]),
  ]);

  const patientsPerDoctor: PatientsPerDoctorEntry[] = patientsPerDoctorRaw.map((d) => ({
    doctorId: String(d.doctorId),
    name: d.name,
    count: d.count,
  }));

  const dateTrend: DateTrendEntry[] = dateTrendRaw.map((d) => ({ date: d._id, count: d.count }));
  const conditionBreakdown: ConditionBreakdownEntry[] = conditionBreakdownRaw.map((d) => ({
    condition: d.condition,
    count: d.count,
  }));

  return { totalDoctors, totalPatients, patientsPerDoctor, dateTrend, conditionBreakdown };
}
