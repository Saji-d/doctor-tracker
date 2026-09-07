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

export interface DashboardSummary {
  totalDoctors: number;
  totalPatients: number;
  patientsPerDoctor: PatientsPerDoctorEntry[];
  dateTrend: DateTrendEntry[];
  conditionBreakdown: ConditionBreakdownEntry[];
}

export function useDashboard(range: string) {
  return useQuery({
    queryKey: ["dashboard", "summary", range],
    queryFn: () => apiClient.get<DashboardSummary>(`/dashboard/summary?range=${range}`),
  });
}
