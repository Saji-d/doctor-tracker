"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { RecentPatientEntry } from "@/hooks/useDashboard";
import { getConditionColor } from "@/lib/condition-colors";
import { formatPatientDate } from "@/lib/format-date";

interface RecentPatientsListProps {
  patients: RecentPatientEntry[];
}

function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function RecentPatientsList({ patients }: RecentPatientsListProps) {
  if (patients.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-10">No patients yet</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-center text-xs uppercase tracking-wide text-muted-foreground">
            <th className="translate-x-[63px] pb-2 text-left font-medium">Name</th>
            <th className="pb-2 font-medium">Age</th>
            <th className="pb-2 font-medium">Condition</th>
            <th className="translate-x-[21px] pb-2 text-left font-medium">Doctor</th>
            <th className="pb-2 font-medium">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {patients.map((p) => (
            <tr key={p.id}>
              <td className="py-2.5">
                <span className="flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-info/10 text-[11px] font-semibold text-info">
                    {initials(p.name)}
                  </span>
                  <span className="font-medium">{p.name}</span>
                </span>
              </td>
              <td className="py-2.5 text-center text-muted-foreground">{p.age}</td>
              <td className="py-2.5 text-center">
                <Badge className={getConditionColor(p.condition).badgeClassName}>{p.condition}</Badge>
              </td>
              <td className="py-2.5">
                <Link href={`/doctors/${p.doctorId}`} className="text-primary hover:underline">
                  {p.doctorName}
                </Link>
              </td>
              <td className="py-2.5 text-center text-muted-foreground">{formatPatientDate(p.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
