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
