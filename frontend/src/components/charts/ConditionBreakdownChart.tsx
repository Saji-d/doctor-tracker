"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from "recharts";
import type { ConditionBreakdownEntry } from "@/hooks/useDashboard";

interface ConditionBreakdownChartProps {
  data: ConditionBreakdownEntry[];
}

// Multiple genuinely different categories (conditions) here, unlike the
// single-series doctor/trend charts — each bar gets its own hue from the
// theme's fixed categorical ramp so conditions stay visually distinguishable,
// cycling only if there are ever more entries than colors.
const CATEGORY_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function ConditionBreakdownChart({ data }: ConditionBreakdownChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-16">No patient data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
        <YAxis type="category" dataKey="condition" width={110} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
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
        <Bar dataKey="count" name="Patients" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((entry, index) => (
            <Cell key={entry.condition} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
