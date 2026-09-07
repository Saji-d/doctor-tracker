"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Phone, Mail } from "lucide-react";
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

function initials(name: string): string {
  const parts = name.replace(/^Dr\.?\s*/i, "").split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
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
        <Link href={`/doctors/${d._id}`} className="group flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(d.name)}
          </span>
          <span className="font-medium group-hover:underline">{d.name}</span>
        </Link>
      ),
    },
    { key: "specialization", header: "Specialization", render: (d) => <Badge>{d.specialization}</Badge> },
    { key: "hospital", header: "Hospital", render: (d) => <span className="text-muted-foreground">{d.hospital}</span> },
    {
      key: "phone",
      header: "Phone",
      render: (d) => (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Phone className="size-3.5 shrink-0" />
          {d.phone}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (d) => (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Mail className="size-3.5 shrink-0" />
          {d.email}
        </span>
      ),
    },
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
