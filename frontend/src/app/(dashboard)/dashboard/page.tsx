"use client";

import { useState } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { ApiClientError } from "@/lib/api-client";
import { StatCard } from "@/components/charts/StatCard";
import { PatientsPerDoctorChart } from "@/components/charts/PatientsPerDoctorChart";
import { DateTrendChart } from "@/components/charts/DateTrendChart";
import { ConditionBreakdownChart } from "@/components/charts/ConditionBreakdownChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, Users, TrendingUp, CalendarPlus, LayoutDashboard, AlertCircle } from "lucide-react";

const RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

export default function DashboardPage() {
  const [range, setRange] = useState("30d");
  const { data, isLoading, isError, error, refetch } = useDashboard(range);

  if (isError) {
    return (
      <div className="p-8">
        <div className="border rounded-xl p-10 text-center space-y-3">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            {error instanceof ApiClientError ? error.message : "Could not reach server — check your connection"}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const totalDoctors = data?.totalDoctors ?? 0;
  const totalPatients = data?.totalPatients ?? 0;
  const avgPerDoctor = totalDoctors > 0 ? (totalPatients / totalDoctors).toFixed(1) : "0";
  const newInRange = data?.dateTrend.reduce((sum, entry) => sum + entry.count, 0) ?? 0;
  const isEmpty = !isLoading && totalDoctors === 0 && totalPatients === 0;
  const rangeLabel = RANGE_OPTIONS.find((o) => o.value === range)?.label.toLowerCase() ?? range;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <LayoutDashboard className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">An overview of your doctors, patients, and recent activity.</p>
        </div>
      </div>

      {isEmpty ? (
        <div className="border rounded-xl p-12 text-center space-y-2">
          <p className="text-sm text-muted-foreground">No data yet — add your first doctor to get started</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Doctors" value={totalDoctors} isLoading={isLoading} icon={Stethoscope} tone="primary" />
            <StatCard label="Total Patients" value={totalPatients} isLoading={isLoading} icon={Users} tone="info" />
            <StatCard
              label="Avg Patients / Doctor"
              value={avgPerDoctor}
              isLoading={isLoading}
              icon={TrendingUp}
              tone="success"
            />
            <StatCard
              label={`New Patients (${rangeLabel})`}
              value={newInRange}
              isLoading={isLoading}
              icon={CalendarPlus}
              tone="warning"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Patients per Doctor</CardTitle>
                <CardDescription>Top 10 doctors by active patient count</CardDescription>
              </CardHeader>
              <CardContent>
                <PatientsPerDoctorChart data={data?.patientsPerDoctor ?? []} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">New Patient Registrations</CardTitle>
                  <CardDescription>Daily new patients in the selected range</CardDescription>
                </div>
                <Select value={range} onValueChange={(v) => v && setRange(v)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Range">
                      {(v: string) => RANGE_OPTIONS.find((o) => o.value === v)?.label ?? v}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {RANGE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <DateTrendChart data={data?.dateTrend ?? []} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Patient Conditions</CardTitle>
              <CardDescription>The most common conditions across all patients, all-time</CardDescription>
            </CardHeader>
            <CardContent>
              <ConditionBreakdownChart data={data?.conditionBreakdown ?? []} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
