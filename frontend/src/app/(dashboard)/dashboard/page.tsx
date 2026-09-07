"use client";

import { useState } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { ApiClientError } from "@/lib/api-client";
import { StatCard } from "@/components/charts/StatCard";
import { PatientsPerDoctorChart } from "@/components/charts/PatientsPerDoctorChart";
import { DateTrendChart } from "@/components/charts/DateTrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
        <div className="border rounded-lg p-8 text-center space-y-3">
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

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {isEmpty ? (
        <div className="border rounded-lg p-12 text-center space-y-2">
          <p className="text-sm text-muted-foreground">No data yet — add your first doctor to get started</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Doctors" value={totalDoctors} isLoading={isLoading} />
            <StatCard label="Total Patients" value={totalPatients} isLoading={isLoading} />
            <StatCard label="Avg Patients / Doctor" value={avgPerDoctor} isLoading={isLoading} />
            <StatCard label={`New Patients (${range})`} value={newInRange} isLoading={isLoading} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Patients per Doctor (Top 10)</CardTitle>
              </CardHeader>
              <CardContent>
                <PatientsPerDoctorChart data={data?.patientsPerDoctor ?? []} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">New Patient Registrations</CardTitle>
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
        </>
      )}
    </div>
  );
}
