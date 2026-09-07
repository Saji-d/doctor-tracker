"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDoctors } from "@/hooks/useDoctors";
import { ApiClientError } from "@/lib/api-client";
import { DoctorTable } from "@/components/doctors/DoctorTable";
import { DoctorForm } from "@/components/doctors/DoctorForm";
import { FilterBar } from "@/components/filters/FilterBar";
import { SearchInput } from "@/components/filters/SearchInput";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { Pagination } from "@/components/data-table/Pagination";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SPECIALIZATIONS = ["Cardiology", "Dermatology", "Neurology", "Orthopedics", "Pediatrics", "General Medicine"];
const LIMIT = 10;

function DoctorsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? "";
  const specialization = searchParams.get("specialization") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  const [isAddOpen, setIsAddOpen] = useState(false);

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
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const hasActiveFilters = Boolean(search || specialization || dateFrom || dateTo);

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Doctors</h1>
        <Button onClick={() => setIsAddOpen(true)}>Add Doctor</Button>
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
        <DateRangeFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChangeFrom={(v) => updateParams({ dateFrom: v || null })}
          onChangeTo={(v) => updateParams({ dateTo: v || null })}
        />
      </FilterBar>

      <DoctorTable
        doctors={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof ApiClientError ? error.message : undefined}
        onRetry={() => refetch()}
        hasActiveFilters={hasActiveFilters}
      />

      {data?.pagination && (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onChange={(p) => updateParams({ page: String(p) }, false)}
        />
      )}

      <Modal open={isAddOpen} onOpenChange={setIsAddOpen} title="Add Doctor" description="Create a new doctor record.">
        <DoctorForm onSuccess={() => setIsAddOpen(false)} />
      </Modal>
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
