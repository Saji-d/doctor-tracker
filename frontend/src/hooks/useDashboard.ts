"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

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
  createdAt: string;
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

export function useDashboard(range: string) {
  return useQuery({
    queryKey: ["dashboard", "summary", range],
    queryFn: () => apiClient.get<DashboardSummary>(`/dashboard/summary?range=${range}`),
  });
}
