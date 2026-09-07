"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import type { PatientsPerDoctorEntry } from "@/hooks/useDashboard";

interface PatientsPerDoctorChartProps {
  data: PatientsPerDoctorEntry[];
}

// Single series (count by doctor) — one consistent accent color, no legend needed.
const BAR_COLOR = "var(--chart-1)";

export function PatientsPerDoctorChart({ data }: PatientsPerDoctorChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-16">No patient data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fontSize: 12 }}
          stroke="var(--muted-foreground)"
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            borderColor: "var(--border)",
            backgroundColor: "var(--card)",
            color: "var(--card-foreground)",
          }}
        />
        <Bar dataKey="count" name="Patients" fill={BAR_COLOR} radius={[0, 4, 4, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
