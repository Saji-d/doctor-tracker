"use client";

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import type { DateTrendEntry } from "@/hooks/useDashboard";

interface DateTrendChartProps {
  data: DateTrendEntry[];
}

// Single series (registrations by day) — one consistent accent color, no legend needed.
const LINE_COLOR = "var(--chart-2)";

export function DateTrendChart({ data }: DateTrendChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-16">No patient registrations in this range</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ left: 0, right: 16, top: 8 }}>
        <defs>
          <linearGradient id="dateTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LINE_COLOR} stopOpacity={0.25} />
            <stop offset="100%" stopColor={LINE_COLOR} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            borderColor: "var(--border)",
            backgroundColor: "var(--card)",
            color: "var(--card-foreground)",
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          name="New patients"
          stroke={LINE_COLOR}
          strokeWidth={2}
          fill="url(#dateTrendFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
