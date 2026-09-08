"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { ConditionBreakdownEntry } from "@/hooks/useDashboard";
import { getConditionColor } from "@/lib/condition-colors";

interface ConditionBreakdownChartProps {
  data: ConditionBreakdownEntry[];
  totalPatients: number;
}

const MAX_SLICES = 5;

export function ConditionBreakdownChart({ data, totalPatients }: ConditionBreakdownChartProps) {
  if (data.length === 0 || totalPatients === 0) {
    return <p className="text-sm text-muted-foreground text-center py-16">No patient data yet</p>;
  }

  const shown = data.slice(0, MAX_SLICES);
  const shownCount = shown.reduce((sum, d) => sum + d.count, 0);
  const others = totalPatients - shownCount;

  const slices = [
    ...shown.map((entry) => ({
      condition: entry.condition,
      count: entry.count,
      percentage: Math.round((entry.count / totalPatients) * 100),
      color: getConditionColor(entry.condition).chart,
    })),
    ...(others > 0
      ? [
          {
            condition: "Others",
            count: others,
            percentage: Math.round((others / totalPatients) * 100),
            color: getConditionColor("Others").chart,
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center">
      <div className="relative shrink-0" style={{ width: 200, height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="count"
              nameKey="condition"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {slices.map((entry) => (
                <Cell key={entry.condition} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} patients`, String(name)]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                borderColor: "var(--border)",
                backgroundColor: "var(--card)",
                color: "var(--card-foreground)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{totalPatients}</span>
          <span className="text-xs text-muted-foreground">Patients</span>
        </div>
      </div>
      <ul className="w-full max-w-xs space-y-2" aria-label="Condition breakdown">
        {slices.map((entry) => (
          <li key={entry.condition} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate">{entry.condition}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {entry.count} ({entry.percentage}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
