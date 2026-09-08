"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDoctor, useDeleteDoctor, type DoctorStatus } from "@/hooks/useDoctors";
import { usePatientsByDoctor, useDeletePatient, type Patient } from "@/hooks/usePatients";
import { ApiClientError } from "@/lib/api-client";
import { DataTable, Column } from "@/components/data-table/DataTable";
import { Pagination } from "@/components/data-table/Pagination";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PatientForm } from "@/components/patients/PatientForm";
import { PatientEditForm } from "@/components/patients/PatientEditForm";
import { DoctorEditForm } from "@/components/doctors/DoctorEditForm";
import { Button } from "@/components/ui/button";
import { getSpecializationStyle } from "@/lib/specialization-colors";
import { getConditionColor } from "@/lib/condition-colors";
import { Phone, Mail, ArrowLeft, Plus, Trash2, Pencil, Users, Building2, Clock } from "lucide-react";

function initials(name: string): string {
  const parts = name.replace(/^Dr\.?\s*/i, "").split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const LIMIT = 10;

// Same three-state visual convention used in DoctorTable.tsx's status
// badges — kept in one place here so the header badge and the "Doctor
// Status" info tile below it always agree.
const STATUS_LABEL: Record<DoctorStatus, string> = {
  active: "Active",
  "on-leave": "On Leave",
  inactive: "Inactive",
};

const STATUS_BADGE_CLASSNAME: Record<DoctorStatus, string> = {
  active: "border-success/25 bg-success/10 text-success",
  "on-leave": "border-warning/25 bg-warning/10 text-warning",
  inactive: "border-destructive/25 bg-destructive/10 text-destructive",
};

const STATUS_DOT_CLASSNAME: Record<DoctorStatus, string> = {
  active: "bg-success",
  "on-leave": "bg-warning",
  inactive: "bg-destructive",
};

function DoctorDetailContent() {
  const params = useParams<{ id: string }>();
  const doctorId = params.id;
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page") ?? "1");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditDoctorOpen, setIsEditDoctorOpen] = useState(false);
  const [isDeleteDoctorOpen, setIsDeleteDoctorOpen] = useState(false);
  const [deleteDoctorError, setDeleteDoctorError] = useState<string | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  const { data: doctor, isLoading: isDoctorLoading, isError: isDoctorError } = useDoctor(doctorId);
  const { data, isLoading, isError, error, refetch } = usePatientsByDoctor(doctorId, page, LIMIT);
  const deletePatient = useDeletePatient();
  const deleteDoctor = useDeleteDoctor();

  async function handleConfirmDeletePatient() {
    if (!patientToDelete) return;
    await deletePatient.mutateAsync(patientToDelete._id);
    setPatientToDelete(null);
  }

  async function handleConfirmDeleteDoctor() {
    if (!doctor) return;
    setDeleteDoctorError(null);
    try {
      await deleteDoctor.mutateAsync(doctor._id);
      router.push("/doctors");
    } catch (err) {
      setDeleteDoctorError(err instanceof ApiClientError ? err.message : "Something went wrong");
    }
  }

  // `pagination.total` is the single source of truth for the assigned-patient
  // count — reused for the info tile, the "Patients" subtitle, and the
  // singular/plural label below, rather than computing it a second way.
  const totalPatients = data?.pagination.total ?? 0;

  const columns: Column<Patient>[] = [
    {
      key: "index",
      header: "#",
      render: (_p, index) => <span className="text-muted-foreground">{(page - 1) * LIMIT + index + 1}</span>,
    },
    { key: "name", header: "Name", render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "age", header: "Age", render: (p) => p.age },
    {
      key: "condition",
      header: "Condition",
      render: (p) => <Badge className={getConditionColor(p.condition).badgeClassName}>{p.condition}</Badge>,
    },
    { key: "phone", header: "Phone", render: (p) => p.phone ?? "—" },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <div className="flex justify-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${p.name}`} onClick={() => setEditingPatient(p)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${p.name}`}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setPatientToDelete(p)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
      className: "text-center",
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

  const specializationStyle = doctor ? getSpecializationStyle(doctor.specialization) : null;
  const SpecializationIcon = specializationStyle?.icon;

  return (
    <div className="p-8 space-y-4">
      <Link href="/doctors" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        Back to Doctors
      </Link>

      <div className="border rounded-xl shadow-sm p-6 space-y-5">
        {isDoctorLoading || !doctor ? (
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 shrink-0 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
                  {initials(doctor.name)}
                </span>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight">{doctor.name}</h1>
                    {SpecializationIcon && specializationStyle && (
                      <Badge className={`gap-1 ${specializationStyle.badgeClassName}`}>
                        <SpecializationIcon className="size-3" />
                        {doctor.specialization}
                      </Badge>
                    )}
                  </div>
                  <p className="max-w-xs truncate text-sm text-muted-foreground" title={doctor.hospital}>
                    {doctor.hospital}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5" /> {doctor.phone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3.5" /> {doctor.email}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Badge className={`gap-1.5 ${STATUS_BADGE_CLASSNAME[doctor.status]}`}>
                  <span className={`size-1.5 rounded-full ${STATUS_DOT_CLASSNAME[doctor.status]}`} aria-hidden="true" />
                  {STATUS_LABEL[doctor.status]}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setIsEditDoctorOpen(true)}>
                  <Pencil className="size-3.5" />
                  Edit Doctor
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete Doctor"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    setDeleteDoctorError(null);
                    setIsDeleteDoctorOpen(true);
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="flex items-center gap-3 rounded-lg border border-info/25 bg-info/10 p-3 text-info">
                <Users className="size-5 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tabular-nums">{totalPatients}</p>
                  <p className="truncate text-xs opacity-75">Assigned Patients</p>
                </div>
              </div>
              <div
                className={`flex items-center gap-3 rounded-lg border p-3 ${specializationStyle?.badgeClassName ?? "border-border bg-muted text-muted-foreground"}`}
              >
                {SpecializationIcon && <SpecializationIcon className="size-5 shrink-0" />}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{doctor.specialization}</p>
                  <p className="truncate text-xs opacity-75">Specialization</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-primary/25 bg-primary/10 p-3 text-primary">
                <Building2 className="size-5 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" title={doctor.hospital}>
                    {doctor.hospital}
                  </p>
                  <p className="truncate text-xs opacity-75">Hospital</p>
                </div>
              </div>
              <div className={`flex items-center gap-3 rounded-lg border p-3 ${STATUS_BADGE_CLASSNAME[doctor.status]}`}>
                <Clock className="size-5 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{STATUS_LABEL[doctor.status]}</p>
                  <p className="truncate text-xs opacity-75">Doctor Status</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Patients</h2>
          <p className="text-sm text-muted-foreground">
            {totalPatients} patient{totalPatients === 1 ? "" : "s"} currently assigned to this doctor.
          </p>
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

      <Modal
        open={editingPatient !== null}
        onOpenChange={(open) => !open && setEditingPatient(null)}
        title="Edit Patient"
        description="Update patient information."
      >
        {editingPatient && doctor && (
          <PatientEditForm patient={editingPatient} doctors={[doctor]} onSuccess={() => setEditingPatient(null)} />
        )}
      </Modal>

      <Modal
        open={isEditDoctorOpen}
        onOpenChange={setIsEditDoctorOpen}
        title="Edit Doctor"
        description="Update this doctor's information."
      >
        {doctor && <DoctorEditForm doctor={doctor} onSuccess={() => setIsEditDoctorOpen(false)} />}
      </Modal>

      <ConfirmDialog
        open={patientToDelete !== null}
        onOpenChange={(open) => !open && setPatientToDelete(null)}
        title="Delete patient?"
        description={patientToDelete ? `This will permanently delete ${patientToDelete.name}. This cannot be undone.` : ""}
        onConfirm={handleConfirmDeletePatient}
        isPending={deletePatient.isPending}
      />

      <ConfirmDialog
        open={isDeleteDoctorOpen}
        onOpenChange={(open) => {
          setIsDeleteDoctorOpen(open);
          if (!open) setDeleteDoctorError(null);
        }}
        title="Delete doctor?"
        description={doctor ? `This will permanently delete ${doctor.name}. This cannot be undone.` : ""}
        onConfirm={handleConfirmDeleteDoctor}
        isPending={deleteDoctor.isPending}
        error={deleteDoctorError}
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
