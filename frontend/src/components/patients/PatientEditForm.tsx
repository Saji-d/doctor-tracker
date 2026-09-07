"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdatePatient } from "@/hooks/usePatients";
import { ApiClientError } from "@/lib/api-client";
import type { Patient } from "@/hooks/usePatients";
import type { Doctor } from "@/hooks/useDoctors";

const phoneRegex = /^\+?[0-9\s]{7,15}$/;

const patientEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().int().min(0, "Age must be 0 or greater").max(150, "Age must be 150 or less"),
  condition: z.string().min(1, "Condition is required"),
  phone: z.union([z.literal(""), z.string().regex(phoneRegex, "Invalid phone number")]).optional(),
  doctorId: z.string().min(1, "Doctor is required"),
});

type PatientEditFormValues = z.infer<typeof patientEditSchema>;

interface PatientEditFormProps {
  patient: Patient;
  doctors: Doctor[];
  onSuccess: () => void;
}

export function PatientEditForm({ patient, doctors, onSuccess }: PatientEditFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const updatePatient = useUpdatePatient();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PatientEditFormValues>({
    resolver: zodResolver(patientEditSchema),
    defaultValues: {
      name: patient.name,
      age: patient.age,
      condition: patient.condition,
      phone: patient.phone ?? "",
      doctorId: patient.doctorId,
    },
  });

  const doctorId = watch("doctorId");

  async function onSubmit(values: PatientEditFormValues) {
    setServerError(null);
    try {
      await updatePatient.mutateAsync({
        id: patient._id,
        input: { ...values, phone: values.phone || undefined },
      });
      onSuccess();
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="age">Age</Label>
        <Input id="age" type="number" {...register("age")} />
        {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="condition">Condition</Label>
        <Input id="condition" {...register("condition")} />
        {errors.condition && <p className="text-sm text-destructive">{errors.condition.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" placeholder="+15551234567" {...register("phone")} />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>
      <div className="space-y-1">
        <Label>Doctor</Label>
        <Select value={doctorId} onValueChange={(v) => setValue("doctorId", v ?? "", { shouldValidate: true })}>
          <SelectTrigger>
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
      {serverError && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
          {serverError}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={updatePatient.isPending}>
        {updatePatient.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
