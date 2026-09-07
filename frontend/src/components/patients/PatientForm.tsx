"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePatientForDoctor } from "@/hooks/usePatients";
import { ApiClientError } from "@/lib/api-client";
import { CONDITIONS } from "@/lib/constants";

const phoneRegex = /^\+?[0-9\s]{7,15}$/;

const patientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().int().min(0, "Age must be 0 or greater").max(150, "Age must be 150 or less"),
  condition: z.string().min(1, "Condition is required"),
  phone: z.union([z.literal(""), z.string().regex(phoneRegex, "Invalid phone number")]).optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  doctorId: string;
  onSuccess: () => void;
}

// This form only covers "add a patient under a specific doctor" — the one
// use case Phase 9 needs. Editing (including doctor reassignment) is a
// different enough shape that it gets its own form in Phase 10, rather than
// bolting an unused "mode" prop onto this one now.
export function PatientForm({ doctorId, onSuccess }: PatientFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const createPatient = useCreatePatientForDoctor(doctorId);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: { condition: "" },
  });

  const condition = watch("condition");

  async function onSubmit(values: PatientFormValues) {
    setServerError(null);
    try {
      await createPatient.mutateAsync({ ...values, phone: values.phone || undefined });
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
      {serverError && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
          {serverError}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={createPatient.isPending}>
        {createPatient.isPending ? "Adding..." : "Add Patient"}
      </Button>
    </form>
  );
}
