"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Pagination } from "./useDoctors";

export interface Patient {
  _id: string;
  name: string;
  age: number;
  condition: string;
  phone?: string;
  doctorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientsResponse {
  data: Patient[];
  pagination: Pagination;
}

export function usePatientsByDoctor(doctorId: string, page: number, limit: number) {
  return useQuery({
    queryKey: ["patients", "byDoctor", doctorId, { page, limit }],
    queryFn: () => apiClient.get<PatientsResponse>(`/doctors/${doctorId}/patients?page=${page}&limit=${limit}`),
    enabled: Boolean(doctorId),
    placeholderData: keepPreviousData,
  });
}

export interface CreatePatientInput {
  name: string;
  age: number;
  condition: string;
  phone?: string;
}

export function useCreatePatientForDoctor(doctorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePatientInput) => apiClient.post<Patient>(`/doctors/${doctorId}/patients`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients", "byDoctor", doctorId] });
      // Dashboard doesn't exist until Phase 11 — invalidating its key now is a
      // harmless no-op today and means the counts will already be wired
      // correctly to refresh once that page lands.
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export interface CreatePatientWithDoctorInput {
  name: string;
  age: number;
  condition: string;
  phone?: string;
  doctorId: string;
}

// Global create — used by the Patients page's "Add Patient" flow, where the
// doctor is chosen in the form rather than fixed by route. Posts to the
// top-level /patients endpoint (vs. useCreatePatientForDoctor's
// /doctors/:id/patients) and invalidates "doctors" in addition to the usual
// "patients"/"dashboard" keys, since doctor-list and doctor-detail views
// both surface a per-doctor patient count that a new patient here can change.
export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePatientWithDoctorInput) => apiClient.post<Patient>("/patients", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export interface PatientsFilters {
  page: number;
  limit: number;
  search?: string;
  condition?: string;
  doctorId?: string;
  dateFrom?: string;
  dateTo?: string;
}

function buildPatientsQueryString(filters: PatientsFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  if (filters.search) params.set("search", filters.search);
  if (filters.condition) params.set("condition", filters.condition);
  if (filters.doctorId) params.set("doctorId", filters.doctorId);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  return params.toString();
}

// Global, cross-doctor list — used by the dedicated Patients page. Shares the
// "patients" query-key prefix with usePatientsByDoctor so a single
// invalidateQueries(["patients"]) after any mutation covers both views.
export function usePatients(filters: PatientsFilters) {
  return useQuery({
    queryKey: ["patients", "all", filters],
    queryFn: () => apiClient.get<PatientsResponse>(`/patients?${buildPatientsQueryString(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export interface UpdatePatientInput {
  name?: string;
  age?: number;
  condition?: string;
  phone?: string;
  doctorId?: string;
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePatientInput }) =>
      apiClient.patch<Patient>(`/patients/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patientId: string) => apiClient.delete<void>(`/patients/${patientId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
