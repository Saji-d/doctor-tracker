"use client";

import { DataTable, Column } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/button";
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
}: PatientTableProps) {
  const columns: Column<Patient>[] = [
    { key: "name", header: "Name", render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "age", header: "Age", render: (p) => p.age },
    { key: "condition", header: "Condition", render: (p) => p.condition },
    { key: "doctor", header: "Doctor", render: (p) => doctorNameById.get(p.doctorId) ?? "—" },
    { key: "phone", header: "Phone", render: (p) => p.phone ?? "—" },
    {
      key: "actions",
      header: "",
      render: (p) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(p)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(p)}>
            Delete
          </Button>
        </div>
      ),
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
