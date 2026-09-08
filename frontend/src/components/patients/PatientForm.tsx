"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePatientForDoctor, useCreatePatient } from "@/hooks/usePatients";
import { ApiClientError } from "@/lib/api-client";
import { CONDITIONS } from "@/lib/constants";
import type { Doctor } from "@/hooks/useDoctors";

const phoneRegex = /^\+?[0-9\s]{7,15}$/;

const baseFields = {
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().int().min(0, "Age must be 0 or greater").max(150, "Age must be 150 or less"),
  condition: z.string().min(1, "Condition is required"),
  phone: z.union([z.literal(""), z.string().regex(phoneRegex, "Invalid phone number")]).optional(),
};

// Fixed-doctor mode (Doctor Detail page): no doctor picker, so doctorId isn't
// part of the form at all — unchanged since Phase 9.
const patientSchemaFixedDoctor = z.object({ ...baseFields, doctorId: z.string().optional() });

// Doctor-picker mode (Patients page): doctorId is a required form field.
const patientSchemaWithDoctorPicker = z.object({ ...baseFields, doctorId: z.string().min(1, "Doctor is required") });

// Modeled on the doctor-picker schema (doctorId required) since that's the
// stricter of the two shapes; in fixed-doctor mode doctorId is always
// populated from the `doctorId` prop via defaultValues, so it's never
// actually empty at runtime even though that schema's own type marks it
// optional.
type PatientFormValues = z.infer<typeof patientSchemaWithDoctorPicker>;

// Two mutually exclusive modes, enforced at compile time: pass a fixed
// `doctorId` (Doctor Detail page — no picker, unchanged since Phase 9) or a
// `doctors` list to render a picker and create globally (Patients page).
type PatientFormProps = { onSuccess: () => void } & (
  | { doctorId: string; doctors?: never }
  | { doctorId?: never; doctors: Doctor[] }
);

export function PatientForm(props: PatientFormProps) {
  const { onSuccess } = props;
  const fixedDoctorId = props.doctorId;
  const doctors = props.doctors;

  const [serverError, setServerError] = useState<string | null>(null);
  // Both hooks are called unconditionally (rules of hooks) — only one's
  // mutateAsync/isPending is actually used, chosen by which mode this
  // instance is in.
  const createPatientForDoctor = useCreatePatientForDoctor(fixedDoctorId ?? "");
  const createPatient = useCreatePatient();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(
      fixedDoctorId ? patientSchemaFixedDoctor : patientSchemaWithDoctorPicker
    ) as Resolver<PatientFormValues>,
    defaultValues: { condition: "", doctorId: fixedDoctorId ?? "" },
  });

  const condition = watch("condition");
  const doctorId = watch("doctorId");
  const isPending = fixedDoctorId ? createPatientForDoctor.isPending : createPatient.isPending;

  async function onSubmit(values: PatientFormValues) {
    setServerError(null);
    try {
      if (fixedDoctorId) {
        await createPatientForDoctor.mutateAsync({ ...values, phone: values.phone || undefined });
      } else {
        await createPatient.mutateAsync({
          ...values,
          doctorId: values.doctorId ?? "",
          phone: values.phone || undefined,
        });
      }
      onSuccess();
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="age">Age</Label>
        <Input id="age" type="number" aria-invalid={!!errors.age} {...register("age")} />
        {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="condition">Condition</Label>
        <Select value={condition} onValueChange={(v) => setValue("condition", v ?? "", { shouldValidate: true })}>
          <SelectTrigger id="condition" aria-invalid={!!errors.condition} className="w-full">
            <SelectValue placeholder="Select condition">{(v: string) => v}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CONDITIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.condition && <p className="text-sm text-destructive">{errors.condition.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" placeholder="+8801712345678" aria-invalid={!!errors.phone} {...register("phone")} />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>
      {doctors && (
        <div className="space-y-1">
          <Label htmlFor="doctorId">Doctor</Label>
          <Select value={doctorId} onValueChange={(v) => setValue("doctorId", v ?? "", { shouldValidate: true })}>
            <SelectTrigger id="doctorId" aria-invalid={!!errors.doctorId} className="w-full">
              <SelectValue placeholder="Select doctor">
                {(v: string) => doctors.find((d) => d._id === v)?.name ?? "Select doctor"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {doctors.map((d) => (
                <SelectItem key={d._id} value={d._id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.doctorId && <p className="text-sm text-destructive">{errors.doctorId.message}</p>}
        </div>
      )}
      {serverError && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
          {serverError}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Adding..." : "Add Patient"}
      </Button>
    </form>
  );
}
