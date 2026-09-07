"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
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
  dateFrom?: string;
  dateTo?: string;
}

function buildQueryString(filters: DoctorsFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  if (filters.search) params.set("search", filters.search);
  if (filters.specialization) params.set("specialization", filters.specialization);
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
