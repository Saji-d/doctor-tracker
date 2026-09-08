"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { usePatients, useDeletePatient, type Patient } from "@/hooks/usePatients";
import { useDoctors } from "@/hooks/useDoctors";
import { ApiClientError } from "@/lib/api-client";
import { PatientTable } from "@/components/patients/PatientTable";
import { PatientForm } from "@/components/patients/PatientForm";
import { PatientEditForm } from "@/components/patients/PatientEditForm";
import { FilterBar } from "@/components/filters/FilterBar";
import { SearchInput } from "@/components/filters/SearchInput";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { Pagination } from "@/components/data-table/Pagination";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONDITIONS } from "@/lib/constants";
import { Users, Stethoscope, UserRound, Plus, CheckCircle2 } from "lucide-react";

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
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [justCreatedName, setJustCreatedName] = useState<string | null>(null);

  // Brief self-dismissing confirmation banner — no toast library in this
  // codebase, so a few seconds of local state is the whole mechanism.
  useEffect(() => {
    if (!justCreatedName) return;
    const timer = setTimeout(() => setJustCreatedName(null), 4000);
    return () => clearTimeout(timer);
  }, [justCreatedName]);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
            <p className="text-sm text-muted-foreground">Search, filter, and manage patients across every doctor.</p>
          </div>
        </div>
        <Button
          className="bg-success text-success-foreground hover:bg-success/90"
          onClick={() => setIsAddPatientOpen(true)}
        >
          <Plus className="size-4" />
          Add Patient
        </Button>
      </div>

      {justCreatedName && (
        <div className="flex items-center gap-2 rounded-lg border border-success/25 bg-success/10 p-3 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          {justCreatedName}
        </div>
      )}

      <FilterBar hasActiveFilters={hasActiveFilters} onClear={() => router.replace(pathname)}>
        <SearchInput
          value={search}
          onChange={(v) => updateParams({ search: v || null })}
          placeholder="Search name, condition..."
        />
        <Select value={condition || "all"} onValueChange={(v) => updateParams({ condition: v === "all" ? null : v })}>
          <SelectTrigger className="flex-1 min-w-[160px]">
            <Stethoscope className="size-4 text-muted-foreground" />
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
          <SelectTrigger className="flex-1 min-w-[160px]">
            <UserRound className="size-4 text-muted-foreground" />
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
        open={isAddPatientOpen}
        onOpenChange={setIsAddPatientOpen}
        title="Add Patient"
        description="Create a new patient record."
      >
        <PatientForm
          doctors={doctors}
          onSuccess={() => {
            setIsAddPatientOpen(false);
            setJustCreatedName("Patient added successfully.");
          }}
        />
      </Modal>

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
