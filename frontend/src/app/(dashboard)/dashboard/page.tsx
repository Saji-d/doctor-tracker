"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDashboard } from "@/hooks/useDashboard";
import { ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { StatCard } from "@/components/charts/StatCard";
import { PatientsPerDoctorChart } from "@/components/charts/PatientsPerDoctorChart";
import { DateTrendChart } from "@/components/charts/DateTrendChart";
import { ConditionBreakdownChart } from "@/components/charts/ConditionBreakdownChart";
import { RecentPatientsList } from "@/components/charts/RecentPatientsList";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Stethoscope,
  Users,
  TrendingUp,
  CalendarPlus,
  AlertCircle,
  Sun,
  Moon,
  CloudSun,
  ClipboardList,
  RefreshCw,
  Database,
  Server,
  Clock,
} from "lucide-react";

const RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function useGreeting() {
  return useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const Icon = hour < 12 ? Sun : hour < 18 ? CloudSun : Moon;
    const date = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    return { greeting, Icon, date };
  }, []);
}

export default function DashboardPage() {
  const [range, setRange] = useState("30d");
  const { data, isLoading, isFetching, isError, error, refetch, dataUpdatedAt } = useDashboard(range);
  const { user } = useAuth();
  const { greeting, Icon: GreetingIcon, date } = useGreeting();

  if (isError) {
    return (
      <div className="p-4 sm:p-8">
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
  const rangeDays = parseInt(range, 10) || 30;

  const doctorsTrend =
    data && data.newDoctorsThisMonth > 0 ? { label: `+${data.newDoctorsThisMonth} new this month` } : undefined;
  const patientsTrend =
    data && data.newPatientsThisMonth > 0 ? { label: `+${data.newPatientsThisMonth} new this month` } : undefined;

  const busiestDoctor = data?.patientsPerDoctor?.[0];
  const avgCaption = busiestDoctor ? `Busiest: ${busiestDoctor.name} (${busiestDoctor.count})` : undefined;

  let rangeTrend: { label: string; direction?: "up" | "down" } | undefined;
  if (data) {
    const prev = data.previousRangePatients;
    if (prev > 0) {
      const pct = Math.round(((newInRange - prev) / prev) * 100);
      rangeTrend = { label: `${pct >= 0 ? "+" : ""}${pct}% vs previous ${rangeDays}d`, direction: pct >= 0 ? "up" : "down" };
    } else if (newInRange > 0) {
      rangeTrend = { label: "New activity this period" };
    }
  }

  return (
    <div className="p-4 sm:px-6 sm:py-5 lg:px-8 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <GreetingIcon className="size-4.5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {greeting}
              {user?.email ? `, ${user.email.split("@")[0].replace(/[._]/g, " ")}` : ""}!
            </h1>
            <p className="text-sm text-muted-foreground">An overview of your doctors, patients, and recent activity.</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>

      {isEmpty ? (
        <div className="border rounded-xl p-12 text-center space-y-2">
          <p className="text-sm text-muted-foreground">No data yet — add your first doctor to get started</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Doctors"
              value={totalDoctors}
              isLoading={isLoading}
              icon={Stethoscope}
              tone="primary"
              trend={doctorsTrend}
              href="/doctors"
            />
            <StatCard
              label="Total Patients"
              value={totalPatients}
              isLoading={isLoading}
              icon={Users}
              tone="info"
              trend={patientsTrend}
              href="/patients"
            />
            <StatCard
              label="Avg Patients / Doctor"
              value={avgPerDoctor}
              isLoading={isLoading}
              icon={TrendingUp}
              tone="success"
              caption={avgCaption}
            />
            <StatCard
              label={`New Patients (${rangeLabel})`}
              value={newInRange}
              isLoading={isLoading}
              icon={CalendarPlus}
              tone="warning"
              trend={rangeTrend}
              href="/patients"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">Patients per Doctor</CardTitle>
                  <CardDescription>Top 10 doctors by active patient count</CardDescription>
                </div>
                <Link href="/doctors" className="text-sm font-medium text-primary hover:underline shrink-0">
                  View All
                </Link>
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

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Patient Conditions</CardTitle>
                <CardDescription>Most common conditions across all patients</CardDescription>
              </CardHeader>
              <CardContent>
                <ConditionBreakdownChart data={data?.conditionBreakdown ?? []} totalPatients={totalPatients} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">Recent Patients</CardTitle>
                  <CardDescription>Latest patient registrations</CardDescription>
                </div>
                <Link href="/patients" className="text-sm font-medium text-primary hover:underline shrink-0">
                  View All
                </Link>
              </CardHeader>
              <CardContent>
                <RecentPatientsList patients={data?.recentPatients ?? []} />
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
                <CardDescription>Common tasks to save time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link
                    href="/doctors?new=1"
                    className="flex flex-col items-start gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Stethoscope className="size-4" />
                    </span>
                    <span>
                      <span className="block font-medium">Add Doctor</span>
                      <span className="block text-xs text-muted-foreground">Register a new doctor</span>
                    </span>
                  </Link>
                  <Link
                    href="/doctors"
                    className="flex flex-col items-start gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <span className="flex size-8 items-center justify-center rounded-md bg-info/10 text-info">
                      <ClipboardList className="size-4" />
                    </span>
                    <span>
                      <span className="block font-medium">Manage Doctors</span>
                      <span className="block text-xs text-muted-foreground">Browse & search</span>
                    </span>
                  </Link>
                  <Link
                    href="/patients"
                    className="flex flex-col items-start gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <span className="flex size-8 items-center justify-center rounded-md bg-success/10 text-success">
                      <Users className="size-4" />
                    </span>
                    <span>
                      <span className="block font-medium">Manage Patients</span>
                      <span className="block text-xs text-muted-foreground">Edit & reassign</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <span className="flex size-8 items-center justify-center rounded-md bg-warning/10 text-warning">
                      <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
                    </span>
                    <span>
                      <span className="block font-medium">Refresh Data</span>
                      <span className="block text-xs text-muted-foreground">Reload dashboard</span>
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Status</CardTitle>
                <CardDescription>{isError ? "Connection issue" : "All systems operational"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Database className="size-4" /> Database
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span
                      className={`size-2 rounded-full ${data ? "bg-success" : isLoading ? "bg-warning" : "bg-destructive"}`}
                      aria-hidden="true"
                    />
                    {data ? "Connected" : isLoading ? "Checking…" : "Unreachable"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Server className="size-4" /> API Server
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span
                      className={`size-2 rounded-full ${data ? "bg-success" : isLoading ? "bg-warning" : "bg-destructive"}`}
                      aria-hidden="true"
                    />
                    {data ? "Healthy" : isLoading ? "Checking…" : "Unreachable"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-4" /> Last Updated
                  </span>
                  <span className="font-medium">
                    {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
