"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { useDashboard } from "@/hooks/useDashboard";
import { ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { getDhakaDaypart, getDhakaGreeting, formatDhakaDate, type Daypart } from "@/lib/dhaka-time";
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
  Sunset,
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

const DAYPART_ICON: Record<Daypart, ComponentType<{ className?: string }>> = {
  morning: Sun,
  afternoon: CloudSun,
  evening: Sunset,
  night: Moon,
};

// Bangladesh time, not the visitor's (or server's) local time — see
// lib/dhaka-time.ts. Computed in an effect, not during render, so the
// server-rendered HTML and the client's first paint both show the same
// neutral placeholder; the real Dhaka-based greeting/date replace it right
// after mount, which avoids a hydration mismatch on something time-based.
function useGreeting() {
  const [state, setState] = useState<{ greeting: string; Icon: ComponentType<{ className?: string }>; date: string } | null>(
    null
  );

  useEffect(() => {
    const now = new Date();
    // Deliberate one-time setState-on-mount, not a general pattern: a lazy
    // useState initializer would run during SSR too and reintroduce the
    // exact mismatch this is avoiding, since "now" genuinely differs between
    // the server's render and the client's.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      greeting: getDhakaGreeting(now),
      Icon: DAYPART_ICON[getDhakaDaypart(now)],
      date: formatDhakaDate(now),
    });
  }, []);

  return {
    greeting: state?.greeting ?? "Welcome",
    Icon: state?.Icon ?? Sun,
    date: state?.date ?? "",
  };
}

function scrollToPatientsPerDoctor() {
  document.getElementById("patients-per-doctor-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function DashboardPage() {
  const [range, setRange] = useState("30d");
  const { data, isLoading, isFetching, isError, error, refetch, dataUpdatedAt } = useDashboard(range);
  // The "New Patients" KPI card is deliberately a fixed last-30-days figure,
  // independent of the trend chart's own 7d/30d/90d selector above — when
  // `range` is already "30d" (the default) this is the exact same cached
  // query as `data` (same query key), so it costs nothing extra; it only
  // fires a second request if the user changes the chart's range control.
  const { data: last30 } = useDashboard("30d");
  const { user } = useAuth();
  const { greeting, Icon: GreetingIcon, date } = useGreeting();
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);

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
  const isEmpty = !isLoading && totalDoctors === 0 && totalPatients === 0;

  const doctorsTrend =
    data && data.newDoctorsThisMonth > 0 ? { label: `+${data.newDoctorsThisMonth} new this month` } : undefined;
  const patientsTrend =
    data && data.newPatientsThisMonth > 0 ? { label: `+${data.newPatientsThisMonth} new this month` } : undefined;

  // A fixed calculation caption rather than a growth figure — this metric is
  // a ratio, not a count, so "vs last month" would need a snapshot of a past
  // ratio we don't keep; stating what it's computed from is honest instead.
  const avgCaption = "Based on all registered patients";

  // Deliberately fixed to the last 30 days regardless of the trend chart's
  // own range selector below (see the `last30` query above).
  const newPatients30d = last30?.dateTrend.reduce((sum, entry) => sum + entry.count, 0) ?? 0;
  let trend30d: { label: string; direction?: "up" | "down" } | undefined;
  if (last30) {
    const prev = last30.previousRangePatients;
    if (prev > 0) {
      const pct = Math.round(((newPatients30d - prev) / prev) * 100);
      trend30d = { label: `${pct >= 0 ? "+" : ""}${pct}% vs previous 30d`, direction: pct >= 0 ? "up" : "down" };
    } else if (newPatients30d > 0) {
      trend30d = { label: "New activity this period" };
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
              actionLabel="View doctors"
            />
            <StatCard
              label="Total Patients"
              value={totalPatients}
              isLoading={isLoading}
              icon={Users}
              tone="success"
              trend={patientsTrend}
              href="/patients"
              actionLabel="View all patients"
            />
            <StatCard
              label="Avg Patients / Doctor"
              value={avgPerDoctor}
              isLoading={isLoading}
              icon={TrendingUp}
              tone="purple"
              caption={avgCaption}
              onClick={scrollToPatientsPerDoctor}
              actionLabel="Jump to Patients per Doctor chart"
            />
            <StatCard
              label="New Patients (30d)"
              value={newPatients30d}
              isLoading={isLoading}
              icon={CalendarPlus}
              tone="warning"
              trend={trend30d}
              href={`/patients?dateFrom=${thirtyDaysAgo}`}
              actionLabel="View recent patients"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card id="patients-per-doctor-section" className="scroll-mt-20">
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
