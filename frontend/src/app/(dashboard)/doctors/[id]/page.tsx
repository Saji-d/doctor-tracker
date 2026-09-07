"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDoctor } from "@/hooks/useDoctors";
import { usePatientsByDoctor, useDeletePatient, type Patient } from "@/hooks/usePatients";
import { ApiClientError } from "@/lib/api-client";
import { DataTable, Column } from "@/components/data-table/DataTable";
import { Pagination } from "@/components/data-table/Pagination";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PatientForm } from "@/components/patients/PatientForm";
import { Button } from "@/components/ui/button";
import { Phone, Mail, ArrowLeft, Plus, Trash2, Users } from "lucide-react";

function initials(name: string): string {
  const parts = name.replace(/^Dr\.?\s*/i, "").split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const LIMIT = 10;

function DoctorDetailContent() {
  const params = useParams<{ id: string }>();
  const doctorId = params.id;
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page") ?? "1");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  const { data: doctor, isLoading: isDoctorLoading, isError: isDoctorError } = useDoctor(doctorId);
  const { data, isLoading, isError, error, refetch } = usePatientsByDoctor(doctorId, page, LIMIT);
  const deletePatient = useDeletePatient();

  async function handleConfirmDelete() {
    if (!patientToDelete) return;
    await deletePatient.mutateAsync(patientToDelete._id);
    setPatientToDelete(null);
  }

  const columns: Column<Patient>[] = [
    { key: "name", header: "Name", render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "age", header: "Age", render: (p) => p.age },
    { key: "condition", header: "Condition", render: (p) => <Badge variant="secondary">{p.condition}</Badge> },
    { key: "phone", header: "Phone", render: (p) => p.phone ?? "—" },
    {
      key: "actions",
      header: "",
      render: (p) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${p.name}`}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setPatientToDelete(p)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ),
      className: "text-right",
    },
  ];

  if (isDoctorError) {
    return (
      <div className="p-8 space-y-3">
        <p className="text-sm text-muted-foreground">Doctor not found.</p>
        <Link href="/doctors" className="text-sm underline">
          Back to Doctors
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-4">
      <Link href="/doctors" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        Back to Doctors
      </Link>

      <div className="border rounded-xl shadow-sm p-6">
        {isDoctorLoading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 shrink-0 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                {doctor ? initials(doctor.name) : ""}
              </span>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">{doctor?.name}</h1>
                  {doctor?.specialization && <Badge>{doctor.specialization}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{doctor?.hospital}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {doctor?.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5" /> {doctor.phone}
                    </span>
                  )}
                  {doctor?.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3.5" /> {doctor.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-info/10 px-4 py-2.5 text-info">
              <Users className="size-4" />
              <div className="text-sm">
                <span className="font-semibold tabular-nums">{data?.pagination.total ?? 0}</span>{" "}
                <span className="text-info/80">patient{data?.pagination.total === 1 ? "" : "s"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Patients</h2>
          <p className="text-sm text-muted-foreground">Everyone currently assigned to this doctor.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="size-4" />
          Add Patient
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(p) => p._id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof ApiClientError ? error.message : undefined}
        onRetry={() => refetch()}
        emptyState={
          <p className="text-center text-sm text-muted-foreground">
            No patients yet for this doctor — use &ldquo;Add Patient&rdquo; to add the first one
          </p>
        }
        footer={
          data?.pagination && (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              limit={data.pagination.limit}
              itemLabel="patients"
              onChange={(p) => {
                const sp = new URLSearchParams(searchParams.toString());
                sp.set("page", String(p));
                router.replace(`?${sp.toString()}`);
              }}
            />
          )
        }
      />

      <Modal open={isAddOpen} onOpenChange={setIsAddOpen} title="Add Patient" description="Add a new patient under this doctor.">
        <PatientForm doctorId={doctorId} onSuccess={() => setIsAddOpen(false)} />
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

export default function DoctorDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading...</div>}>
      <DoctorDetailContent />
    </Suspense>
  );
}
