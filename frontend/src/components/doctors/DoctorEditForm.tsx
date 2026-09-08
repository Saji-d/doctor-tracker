"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateDoctor } from "@/hooks/useDoctors";
import { ApiClientError } from "@/lib/api-client";
import { SPECIALIZATIONS } from "@/lib/constants";
import type { Doctor, DoctorStatus } from "@/hooks/useDoctors";

const phoneRegex = /^\+?[0-9\s]{7,15}$/;

const STATUS_OPTIONS: { value: DoctorStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "on-leave", label: "On Leave" },
  { value: "inactive", label: "Inactive" },
];

const doctorEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  specialization: z.string().min(1, "Specialization is required"),
  hospital: z.string().min(1, "Hospital is required"),
  phone: z.string().regex(phoneRegex, "Invalid phone number"),
  email: z.string().email("Invalid email address"),
  status: z.enum(["active", "on-leave", "inactive"]),
});

type DoctorEditFormValues = z.infer<typeof doctorEditSchema>;

interface DoctorEditFormProps {
  doctor: Doctor;
  onSuccess: () => void;
}

export function DoctorEditForm({ doctor, onSuccess }: DoctorEditFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const updateDoctor = useUpdateDoctor();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DoctorEditFormValues>({
    resolver: zodResolver(doctorEditSchema),
    defaultValues: {
      name: doctor.name,
      specialization: doctor.specialization,
      hospital: doctor.hospital,
      phone: doctor.phone,
      email: doctor.email,
      status: doctor.status,
    },
  });

  const specialization = watch("specialization");
  const status = watch("status");

  async function onSubmit(values: DoctorEditFormValues) {
    setServerError(null);
    try {
      await updateDoctor.mutateAsync({ id: doctor._id, input: values });
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
        <Label htmlFor="specialization">Specialization</Label>
        <Select
          value={specialization}
          onValueChange={(v) => setValue("specialization", v ?? "", { shouldValidate: true })}
        >
          <SelectTrigger id="specialization" aria-invalid={!!errors.specialization} className="w-full">
            <SelectValue placeholder="Select specialization">{(v: string) => v}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SPECIALIZATIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.specialization && <p className="text-sm text-destructive">{errors.specialization.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="hospital">Hospital</Label>
        <Input id="hospital" aria-invalid={!!errors.hospital} {...register("hospital")} />
        {errors.hospital && <p className="text-sm text-destructive">{errors.hospital.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" placeholder="+8801712345678" aria-invalid={!!errors.phone} {...register("phone")} />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" aria-invalid={!!errors.email} {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={(v) => setValue("status", (v as DoctorStatus) ?? "active", { shouldValidate: true })}>
          <SelectTrigger id="status" aria-invalid={!!errors.status} className="w-full">
            <SelectValue placeholder="Select status">
              {(v: DoctorStatus) => STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
      </div>
      {serverError && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
          {serverError}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={updateDoctor.isPending}>
        {updateDoctor.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
