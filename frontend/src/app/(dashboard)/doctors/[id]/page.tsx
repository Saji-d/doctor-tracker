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
import { PatientForm } from "@/components/patients/PatientForm";
import { Button } from "@/components/ui/button";

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
    { key: "condition", header: "Condition", render: (p) => p.condition },
    { key: "phone", header: "Phone", render: (p) => p.phone ?? "—" },
    {
      key: "actions",
      header: "",
      render: (p) => (
        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setPatientToDelete(p)}>
          Delete
        </Button>
      ),
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
      <Link href="/doctors" className="text-sm text-muted-foreground hover:underline">
        ← Back to Doctors
      </Link>

      <div className="border rounded-lg p-4">
        {isDoctorLoading ? (
          <p className="text-sm text-muted-foreground">Loading doctor...</p>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">{doctor?.name}</h1>
            <p className="text-sm text-muted-foreground">
              {doctor?.specialization} · {doctor?.hospital}
            </p>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Patients</h2>
        <Button onClick={() => setIsAddOpen(true)}>Add Patient</Button>
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(p) => p._id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof ApiClientError ? error.message : undefined}
        onRetry={() => refetch()}
        emptyState={<p className="text-center text-sm text-muted-foreground">No patients yet for this doctor</p>}
      />

      {data?.pagination && (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onChange={(p) => {
            const sp = new URLSearchParams(searchParams.toString());
            sp.set("page", String(p));
            router.replace(`?${sp.toString()}`);
          }}
        />
      )}

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
