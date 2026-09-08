"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type DoctorStatus = "active" | "on-leave" | "inactive";

export interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  status: DoctorStatus;
  createdAt: string;
  updatedAt: string;
  // Only present on list responses (GET /doctors) — the single-doctor detail
  // endpoint doesn't compute it.
  patientCount?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DoctorsResponse {
  data: Doctor[];
  pagination: Pagination;
}

export interface DoctorsFilters {
  page: number;
  limit: number;
  search?: string;
  specialization?: string;
  hospital?: string;
  dateFrom?: string;
  dateTo?: string;
}

function buildQueryString(filters: DoctorsFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  if (filters.search) params.set("search", filters.search);
  if (filters.specialization) params.set("specialization", filters.specialization);
  if (filters.hospital) params.set("hospital", filters.hospital);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  return params.toString();
}

export function useDoctors(filters: DoctorsFilters) {
  return useQuery({
    queryKey: ["doctors", filters],
    queryFn: () => apiClient.get<DoctorsResponse>(`/doctors?${buildQueryString(filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: ["doctors", "detail", id],
    queryFn: () => apiClient.get<Doctor>(`/doctors/${id}`),
    enabled: Boolean(id),
  });
}

export interface CreateDoctorInput {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDoctorInput) => apiClient.post<Doctor>("/doctors", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export interface UpdateDoctorInput {
  name?: string;
  specialization?: string;
  hospital?: string;
  phone?: string;
  email?: string;
  status?: DoctorStatus;
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDoctorInput }) =>
      apiClient.patch<Doctor>(`/doctors/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/doctors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}
