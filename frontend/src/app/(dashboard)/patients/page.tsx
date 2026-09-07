"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { usePatients, useDeletePatient, type Patient } from "@/hooks/usePatients";
import { useDoctors } from "@/hooks/useDoctors";
import { ApiClientError } from "@/lib/api-client";
import { PatientTable } from "@/components/patients/PatientTable";
import { PatientEditForm } from "@/components/patients/PatientEditForm";
import { FilterBar } from "@/components/filters/FilterBar";
import { SearchInput } from "@/components/filters/SearchInput";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { Pagination } from "@/components/data-table/Pagination";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONDITIONS } from "@/lib/constants";

const LIMIT = 10;

function PatientsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? "";
  const condition = searchParams.get("condition") ?? "";
  const doctorId = searchParams.get("doctorId") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      if (resetPage) params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const { data, isLoading, isError, error, refetch } = usePatients({
    page,
    limit: LIMIT,
    search: search || undefined,
    condition: condition || undefined,
    doctorId: doctorId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // Patients only store doctorId — resolve names for display/filter from a
  // single doctors fetch (12 seeded doctors; fine to pull them all in one
  // page at this scale rather than a per-row lookup). 50 is the backend's
  // hard cap on `limit` (see doctors.validators.ts) — comfortably above the
  // current doctor count, but not a number to raise casually since it's a
  // deliberate anti-abuse ceiling, not an arbitrary default.
  const { data: doctorsData } = useDoctors({ page: 1, limit: 50 });
  const doctors = doctorsData?.data ?? [];
  const doctorNameById = new Map(doctors.map((d) => [d._id, d.name]));

  const deletePatient = useDeletePatient();

  async function handleConfirmDelete() {
    if (!patientToDelete) return;
    await deletePatient.mutateAsync(patientToDelete._id);
    setPatientToDelete(null);
  }

  const hasActiveFilters = Boolean(search || condition || doctorId || dateFrom || dateTo);

  return (
    <div className="p-8 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
        <p className="text-sm text-muted-foreground">Search, filter, and manage patients across every doctor.</p>
      </div>

      <FilterBar hasActiveFilters={hasActiveFilters} onClear={() => router.replace(pathname)}>
        <SearchInput
          value={search}
          onChange={(v) => updateParams({ search: v || null })}
          placeholder="Search name, condition..."
        />
        <Select value={condition || "all"} onValueChange={(v) => updateParams({ condition: v === "all" ? null : v })}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Condition">
              {(v: string) => (v === "all" ? "All conditions" : v)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All conditions</SelectItem>
            {CONDITIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={doctorId || "all"} onValueChange={(v) => updateParams({ doctorId: v === "all" ? null : v })}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Doctor">
              {(v: string) => (v === "all" ? "All doctors" : (doctorNameById.get(v) ?? v))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All doctors</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d._id} value={d._id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangeFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChangeFrom={(v) => updateParams({ dateFrom: v || null })}
          onChangeTo={(v) => updateParams({ dateTo: v || null })}
        />
      </FilterBar>

      <PatientTable
        patients={data?.data ?? []}
        doctorNameById={doctorNameById}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof ApiClientError ? error.message : undefined}
        onRetry={() => refetch()}
        hasActiveFilters={hasActiveFilters}
        onEdit={(p) => setEditingPatient(p)}
        onDelete={(p) => setPatientToDelete(p)}
        footer={
          data?.pagination && (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              limit={data.pagination.limit}
              itemLabel="patients"
              onChange={(p) => updateParams({ page: String(p) }, false)}
            />
          )
        }
      />

      <Modal
        open={editingPatient !== null}
        onOpenChange={(open) => !open && setEditingPatient(null)}
        title="Edit Patient"
        description="Update patient information."
      >
        {editingPatient && (
          <PatientEditForm patient={editingPatient} doctors={doctors} onSuccess={() => setEditingPatient(null)} />
        )}
      </Modal>

      <ConfirmDialog
        open={patientToDelete !== null}
        onOpenChange={(open) => !open && setPatientToDelete(null)}
        title="Delete patient?"
        description={patientToDelete ? `This will permanently delete ${patientToDelete.name}. This cannot be undone.` : ""}
        onConfirm={handleConfirmDelete}
        isPending={deletePatient.isPending}
      />
    </div>
  );
}

export default function PatientsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading...</div>}>
      <PatientsPageContent />
    </Suspense>
  );
}
