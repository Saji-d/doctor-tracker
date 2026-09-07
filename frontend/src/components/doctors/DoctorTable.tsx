"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { DataTable, Column } from "@/components/data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import type { Doctor } from "@/hooks/useDoctors";

interface DoctorTableProps {
  doctors: Doctor[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  hasActiveFilters: boolean;
  footer?: ReactNode;
}

export function DoctorTable({
  doctors,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  hasActiveFilters,
  footer,
}: DoctorTableProps) {
  const columns: Column<Doctor>[] = [
    {
      key: "name",
      header: "Name",
      render: (d) => (
        <Link href={`/doctors/${d._id}`} className="font-medium hover:underline">
          {d.name}
        </Link>
      ),
    },
    { key: "specialization", header: "Specialization", render: (d) => <Badge>{d.specialization}</Badge> },
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
      footer={footer}
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
