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

export interface RecentPatientEntry {
  id: string;
  name: string;
  age: number;
  condition: string;
  doctorId: string;
  doctorName: string;
  createdAt: Date;
}

export interface DashboardSummary {
  totalDoctors: number;
  totalPatients: number;
  newDoctorsThisMonth: number;
  newPatientsThisMonth: number;
  previousRangePatients: number;
  patientsPerDoctor: PatientsPerDoctorEntry[];
  dateTrend: DateTrendEntry[];
  conditionBreakdown: ConditionBreakdownEntry[];
  recentPatients: RecentPatientEntry[];
}

function parseRangeDays(range: string): number {
  const match = /^(\d+)d$/.exec(range);
  return match ? parseInt(match[1], 10) : 30;
}

function startOfMonthUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

// Deliberately NOT one $facet pipeline: $facet's inner stages can't use an
// index, which would force dateTrend's $match to give up the createdAt
// index it gets by being a standalone pipeline's leading stage. Small,
// independently-optimal queries in parallel are both simpler and faster
// than one pipeline built to look clever. totalPatients/patientsPerDoctor/
// newDoctorsThisMonth/newPatientsThisMonth/conditionBreakdown are
// intentionally scoped to ALL patients (or the calendar month, for the
// "this month" counters) — only dateTrend and previousRangePatients respect
// the `range` query param.
export async function getSummary(range: string): Promise<DashboardSummary> {
  const days = parseRangeDays(range);
  const now = new Date();
  const rangeStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousRangeStart = new Date(rangeStart.getTime() - days * 24 * 60 * 60 * 1000);
  const monthStart = startOfMonthUTC(now);

  const [
    totalDoctors,
    totalPatients,
    newDoctorsThisMonth,
    newPatientsThisMonth,
    previousRangePatients,
    patientsPerDoctorRaw,
    dateTrendRaw,
    conditionBreakdownRaw,
    recentPatientsRaw,
  ] = await Promise.all([
    Doctor.countDocuments(),
    Patient.countDocuments(),
    Doctor.countDocuments({ createdAt: { $gte: monthStart } }),
    Patient.countDocuments({ createdAt: { $gte: monthStart } }),
    // The window immediately before the selected range, same length — lets
    // the frontend show a genuine "vs previous period" comparison instead of
    // a manufactured one.
    Patient.countDocuments({ createdAt: { $gte: previousRangeStart, $lt: rangeStart } }),
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
    // Top-N sort+limit on `createdAt` uses the same index as dateTrend; the
    // $lookup join is bounded to at most 5 documents regardless of collection
    // size, so it stays cheap even though $lookup itself can't use an index.
    Patient.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      { $lookup: { from: "doctors", localField: "doctorId", foreignField: "_id", as: "doctor" } },
      { $unwind: "$doctor" },
      {
        $project: {
          id: "$_id",
          name: 1,
          age: 1,
          condition: 1,
          doctorId: "$doctor._id",
          doctorName: "$doctor.name",
          createdAt: 1,
          _id: 0,
        },
      },
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
  const recentPatients: RecentPatientEntry[] = recentPatientsRaw.map((p) => ({
    id: String(p.id),
    name: p.name,
    age: p.age,
    condition: p.condition,
    doctorId: String(p.doctorId),
    doctorName: p.doctorName,
    createdAt: p.createdAt,
  }));

  return {
    totalDoctors,
    totalPatients,
    newDoctorsThisMonth,
    newPatientsThisMonth,
    previousRangePatients,
    patientsPerDoctor,
    dateTrend,
    conditionBreakdown,
    recentPatients,
  };
}
