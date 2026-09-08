"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Phone, Mail, Building2, Users, Pencil, Trash2 } from "lucide-react";
import { DataTable, Column } from "@/components/data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSpecializationStyle } from "@/lib/specialization-colors";
import type { Doctor } from "@/hooks/useDoctors";

interface DoctorTableProps {
  doctors: Doctor[];
  // Used only to compute each row's overall position (e.g. page 2 shows
  // 11, 12, ...) rather than resetting to 1 on every page.
  page: number;
  limit: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  hasActiveFilters: boolean;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctor: Doctor) => void;
  footer?: ReactNode;
}

function initials(name: string): string {
  const parts = name.replace(/^Dr\.?\s*/i, "").split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function DoctorTable({
  doctors,
  page,
  limit,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  hasActiveFilters,
  onEdit,
  onDelete,
  footer,
}: DoctorTableProps) {
  const columns: Column<Doctor>[] = [
    {
      key: "index",
      header: "#",
      render: (_d, index) => <span className="text-muted-foreground">{(page - 1) * limit + index + 1}</span>,
    },
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
    {
      key: "specialization",
      header: "Specialization",
      render: (d) => {
        const style = getSpecializationStyle(d.specialization);
        const Icon = style.icon;
        return (
          <Badge className={`gap-1 ${style.badgeClassName}`}>
            <Icon className="size-3" />
            {d.specialization}
          </Badge>
        );
      },
    },
    {
      key: "hospital",
      header: "Hospital",
      render: (d) => (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Building2 className="size-3.5 shrink-0" />
          {d.hospital}
        </span>
      ),
    },
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
    {
      key: "patients",
      header: "Patients",
      render: (d) => (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="size-3.5 shrink-0" />
          {d.patientCount ?? 0}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (d) =>
        d.status === "active" ? (
          <Badge className="gap-1.5 border-success/25 bg-success/10 text-success">
            <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
            Active
          </Badge>
        ) : (
          <Badge className="gap-1.5 border-warning/25 bg-warning/10 text-warning">
            <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
            On Leave
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (d) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${d.name}`} onClick={() => onEdit(d)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${d.name}`}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(d)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
      className: "text-right",
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
