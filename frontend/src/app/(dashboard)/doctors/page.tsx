"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDoctors, useDeleteDoctor, type Doctor } from "@/hooks/useDoctors";
import { ApiClientError } from "@/lib/api-client";
import { DoctorTable } from "@/components/doctors/DoctorTable";
import { DoctorForm } from "@/components/doctors/DoctorForm";
import { DoctorEditForm } from "@/components/doctors/DoctorEditForm";
import { StatCard } from "@/components/charts/StatCard";
import { FilterBar } from "@/components/filters/FilterBar";
import { SearchInput } from "@/components/filters/SearchInput";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { Pagination } from "@/components/data-table/Pagination";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SPECIALIZATIONS } from "@/lib/constants";
import { Stethoscope, Plus, Users, Layers, Building2, UserCheck } from "lucide-react";

const LIMIT = 10;
// Comfortably above the current doctor count and matches the backend's hard
// cap on `limit` — reused elsewhere (e.g. the Patients page's doctor lookup)
// for the same reason: one bounded fetch of "all" doctors, not an
// unbounded one.
const ALL_DOCTORS_LIMIT = 50;

function DoctorsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? "";
  const specialization = searchParams.get("specialization") ?? "";
  const hospital = searchParams.get("hospital") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  // Lazy-initialized from the URL so the dashboard's "Add Doctor" quick
  // action can deep-link straight into this modal (/doctors?new=1); once
  // open/closed, this is ordinary local state.
  const [isAddOpen, setIsAddOpen] = useState(() => searchParams.get("new") === "1");
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Strips the one-shot ?new=1 param after reading it above, so a refresh
  // or back-navigation doesn't reopen the modal.
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("new");
    router.replace(params.toString() ? `${pathname}?${params}` : pathname);
  }, [searchParams, router, pathname]);

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

  const { data, isLoading, isError, error, refetch } = useDoctors({
    page,
    limit: LIMIT,
    search: search || undefined,
    specialization: specialization || undefined,
    hospital: hospital || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // Deliberately unfiltered — these back the KPI cards and the Hospital
  // filter's own option list, so they stay stable regardless of whatever
  // the user is currently searching/filtering for.
  const { data: allDoctorsData } = useDoctors({ page: 1, limit: ALL_DOCTORS_LIMIT });
  const allDoctors = useMemo(() => allDoctorsData?.data ?? [], [allDoctorsData]);

  const hospitals = useMemo(
    () => Array.from(new Set(allDoctors.map((d) => d.hospital))).sort((a, b) => a.localeCompare(b)),
    [allDoctors]
  );
  const specializationsCount = useMemo(() => new Set(allDoctors.map((d) => d.specialization)).size, [allDoctors]);
  const activeDoctorsCount = useMemo(() => allDoctors.filter((d) => d.status === "active").length, [allDoctors]);
  const newDoctorsThisMonth = useMemo(() => {
    const now = new Date();
    return allDoctors.filter((d) => {
      const created = new Date(d.createdAt);
      return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
    }).length;
  }, [allDoctors]);

  const deleteDoctor = useDeleteDoctor();

  async function handleConfirmDelete() {
    if (!doctorToDelete) return;
    setDeleteError(null);
    try {
      await deleteDoctor.mutateAsync(doctorToDelete._id);
      setDoctorToDelete(null);
    } catch (err) {
      setDeleteError(err instanceof ApiClientError ? err.message : "Something went wrong");
    }
  }

  const hasActiveFilters = Boolean(search || specialization || hospital || dateFrom || dateTo);

  return (
    <div className="p-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Stethoscope className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Doctors</h1>
            <p className="text-sm text-muted-foreground">Browse, search, and manage the doctors in your network.</p>
          </div>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="size-4" />
          Add Doctor
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Doctors"
          value={allDoctorsData?.pagination.total ?? 0}
          icon={Users}
          tone="primary"
          trend={newDoctorsThisMonth > 0 ? { label: `+${newDoctorsThisMonth} new this month` } : undefined}
        />
        <StatCard
          label="Specializations"
          value={specializationsCount}
          icon={Layers}
          tone="success"
          caption="Across all doctors"
        />
        <StatCard label="Hospitals" value={hospitals.length} icon={Building2} tone="purple" caption="Partner hospitals" />
        <StatCard
          label="Active Doctors"
          value={activeDoctorsCount}
          icon={UserCheck}
          tone="warning"
          caption="Currently practicing"
        />
      </div>

      <FilterBar hasActiveFilters={hasActiveFilters} onClear={() => router.replace(pathname)}>
        <SearchInput
          value={search}
          onChange={(v) => updateParams({ search: v || null })}
          placeholder="Search name, specialization, hospital..."
        />
        <Select
          value={specialization || "all"}
          onValueChange={(v) => updateParams({ specialization: v === "all" ? null : v })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Specialization">
              {(v: string) => (v === "all" ? "All specializations" : v)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All specializations</SelectItem>
            {SPECIALIZATIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={hospital || "all"} onValueChange={(v) => updateParams({ hospital: v === "all" ? null : v })}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Hospital">{(v: string) => (v === "all" ? "All hospitals" : v)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All hospitals</SelectItem>
            {hospitals.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
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

      <DoctorTable
        doctors={data?.data ?? []}
        page={page}
        limit={LIMIT}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof ApiClientError ? error.message : undefined}
        onRetry={() => refetch()}
        hasActiveFilters={hasActiveFilters}
        onEdit={(d) => setEditingDoctor(d)}
        onDelete={(d) => {
          setDeleteError(null);
          setDoctorToDelete(d);
        }}
        footer={
          data?.pagination && (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              limit={data.pagination.limit}
              itemLabel="doctors"
              onChange={(p) => updateParams({ page: String(p) }, false)}
            />
          )
        }
      />

      <Modal open={isAddOpen} onOpenChange={setIsAddOpen} title="Add Doctor" description="Create a new doctor record.">
        <DoctorForm onSuccess={() => setIsAddOpen(false)} />
      </Modal>

      <Modal
        open={editingDoctor !== null}
        onOpenChange={(open) => !open && setEditingDoctor(null)}
        title="Edit Doctor"
        description="Update this doctor's information."
      >
        {editingDoctor && <DoctorEditForm doctor={editingDoctor} onSuccess={() => setEditingDoctor(null)} />}
      </Modal>

      <ConfirmDialog
        open={doctorToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDoctorToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete doctor?"
        description={
          doctorToDelete ? `This will permanently delete ${doctorToDelete.name}. This cannot be undone.` : ""
        }
        onConfirm={handleConfirmDelete}
        isPending={deleteDoctor.isPending}
        error={deleteError}
      />
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading...</div>}>
      <DoctorsPageContent />
    </Suspense>
  );
}
