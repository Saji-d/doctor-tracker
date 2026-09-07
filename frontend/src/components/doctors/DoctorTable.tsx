"use client";

import { DataTable, Column } from "@/components/data-table/DataTable";
import type { Doctor } from "@/hooks/useDoctors";

interface DoctorTableProps {
  doctors: Doctor[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  hasActiveFilters: boolean;
}

export function DoctorTable({ doctors, isLoading, isError, errorMessage, onRetry, hasActiveFilters }: DoctorTableProps) {
  const columns: Column<Doctor>[] = [
    { key: "name", header: "Name", render: (d) => <span className="font-medium">{d.name}</span> },
    { key: "specialization", header: "Specialization", render: (d) => d.specialization },
    { key: "hospital", header: "Hospital", render: (d) => d.hospital },
    { key: "phone", header: "Phone", render: (d) => d.phone },
    { key: "email", header: "Email", render: (d) => d.email },
  ];

  return (
    <DataTable
      columns={columns}
      rows={doctors}
      rowKey={(d) => d._id}
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      onRetry={onRetry}
      emptyState={
        hasActiveFilters ? (
          <p className="text-center text-sm text-muted-foreground">No doctors found — try adjusting filters</p>
        ) : (
          <p className="text-center text-sm text-muted-foreground">No doctors yet — add your first doctor to get started</p>
        )
      }
    />
  );
}
