"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Pencil, Trash2, Phone } from "lucide-react";
import { DataTable, Column } from "@/components/data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPatientDate } from "@/lib/format-date";
import { getConditionColor } from "@/lib/condition-colors";
import type { Patient } from "@/hooks/usePatients";

interface PatientTableProps {
  patients: Patient[];
  doctorNameById: Map<string, string>;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  hasActiveFilters: boolean;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  footer?: ReactNode;
}

function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function PatientTable({
  patients,
  doctorNameById,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  hasActiveFilters,
  onEdit,
  onDelete,
  footer,
}: PatientTableProps) {
  const columns: Column<Patient>[] = [
    {
      key: "name",
      header: "Name",
      render: (p) => (
        <span className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-info/10 text-xs font-semibold text-info">
            {initials(p.name)}
          </span>
          <span className="font-medium">{p.name}</span>
        </span>
      ),
    },
    {
      key: "age",
      header: "Age",
      render: (p) => <span className="text-muted-foreground">{p.age}</span>,
      className: "text-center",
    },
    {
      key: "condition",
      header: "Condition",
      render: (p) => <Badge className={getConditionColor(p.condition).badgeClassName}>{p.condition}</Badge>,
    },
    {
      key: "doctor",
      header: "Doctor",
      render: (p) =>
        doctorNameById.has(p.doctorId) ? (
          <Link href={`/doctors/${p.doctorId}`} className="text-primary hover:underline">
            {doctorNameById.get(p.doctorId)}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (p) =>
        p.phone ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="size-3.5 shrink-0" />
            {p.phone}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "date",
      header: "Date",
      render: (p) => <span className="text-muted-foreground">{formatPatientDate(p.createdAt)}</span>,
      className: "text-center",
    },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <div className="flex justify-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${p.name}`} onClick={() => onEdit(p)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${p.name}`}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(p)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
      className: "text-center",
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={patients}
      rowKey={(p) => p._id}
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      onRetry={onRetry}
      footer={footer}
      emptyState={
        hasActiveFilters ? (
          <p className="text-center text-sm text-muted-foreground">No patients found — try adjusting filters</p>
        ) : (
          <p className="text-center text-sm text-muted-foreground">No patients yet</p>
        )
      }
    />
  );
}
