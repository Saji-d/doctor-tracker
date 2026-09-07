import Link from "next/link";
import Image from "next/image";
import {
  Stethoscope,
  Users,
  Search,
  BarChart3,
  ShieldCheck,
  ClipboardList,
  ArrowRight,
  LayoutDashboard,
  Filter,
  CalendarClock,
} from "lucide-react";

const FEATURES = [
  {
    icon: Stethoscope,
    title: "Doctor Management",
    description:
      "Create and browse doctors with specialization, hospital, and contact details — searchable and filterable at any scale.",
  },
  {
    icon: Users,
    title: "Patient Management",
    description:
      "Add, edit, and reassign patients under the right doctor, or manage the full roster from one dedicated patients view.",
  },
  {
    icon: Search,
    title: "Smart Search & Filtering",
    description:
      "Full-text search plus specialization, condition, and date-range filters — combinable, URL-synced, and instant.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Live totals, patients-per-doctor, condition breakdowns, and registration trends — computed with indexed, parallel queries.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Authentication",
    description:
      "Cookie-based sessions with the backend as the sole authority — every protected route is enforced server-side, not just hidden in the UI.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Stethoscope className="size-4.5" />
            </span>
            Doctor Tracker
          </span>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#analytics" className="hover:text-foreground transition-colors">
              Analytics
            </a>
          </nav>
          <Link
            href="/login"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent)]"
        />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" />
              Built for hospital front-desk operations
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Every doctor, every patient,{" "}
              <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
                one clear view
              </span>
            </h1>
            <p className="max-w-md text-lg text-muted-foreground text-pretty">
              Doctor Tracker is a secure admin console for managing doctors and their patients — with fast search,
              real filtering, and a live analytics dashboard, built for the pace of a real clinic.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/login"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/80"
              >
                Sign In to Dashboard
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex h-11 items-center rounded-xl border bg-background px-6 text-sm font-medium transition-colors hover:bg-muted"
              >
                Explore features
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border shadow-2xl shadow-primary/10 ring-1 ring-foreground/5">
              <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-destructive/40" />
                <span className="size-2.5 rounded-full bg-warning/50" />
                <span className="size-2.5 rounded-full bg-success/50" />
              </div>
              <Image
                src="/preview-dashboard.png"
                alt="Doctor Tracker dashboard showing doctor and patient analytics"
                width={1200}
                height={800}
                priority
                className="w-full"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-xl border bg-card px-4 py-3 shadow-lg sm:flex sm:items-center sm:gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-success/10 text-success">
                <ShieldCheck className="size-4" />
              </span>
              <div className="text-xs">
                <p className="font-medium">Backend-enforced auth</p>
                <p className="text-muted-foreground">Every route verified server-side</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Everything the front desk needs</h2>
            <p className="mt-3 text-muted-foreground">
              A focused feature set, built end to end — no placeholders, no half-finished screens.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-medium">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section id="analytics" className="border-t">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold tracking-tight">Data that&apos;s actually useful</h2>
            <p className="text-muted-foreground text-pretty">
              The dashboard turns your doctor and patient records into a live operational picture — computed with
              indexed, parallel queries so it stays fast as the roster grows.
            </p>
            <ul className="space-y-4">
              {[
                { icon: LayoutDashboard, text: "Doctor and patient totals, updated in real time" },
                { icon: BarChart3, text: "Patients-per-doctor and condition-distribution breakdowns" },
                { icon: CalendarClock, text: "New-patient registration trends over 7, 30, or 90 days" },
                { icon: Filter, text: "Every list view — searchable, filterable, and paginated" },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-info/10 text-info">
                    <item.icon className="size-3.5" />
                  </span>
                  <span className="text-sm">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-transparent to-info/10 p-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <Stethoscope className="size-5 text-primary" />
                <p className="mt-3 text-sm font-medium">Doctors</p>
                <p className="text-xs text-muted-foreground">By specialization &amp; hospital</p>
              </div>
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <Users className="size-5 text-info" />
                <p className="mt-3 text-sm font-medium">Patients</p>
                <p className="text-xs text-muted-foreground">By condition &amp; doctor</p>
              </div>
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <BarChart3 className="size-5 text-success" />
                <p className="mt-3 text-sm font-medium">Trends</p>
                <p className="text-xs text-muted-foreground">Registrations over time</p>
              </div>
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <ClipboardList className="size-5 text-warning" />
                <p className="mt-3 text-sm font-medium">Records</p>
                <p className="text-xs text-muted-foreground">Searchable &amp; paginated</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Ready to take a look?</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Sign in with the demo administrator account to explore the full application.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/80"
          >
            Sign In to Dashboard
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <span className="flex items-center gap-2">
            <Stethoscope className="size-4" />
            Doctor Tracker
          </span>
          <span>Next.js · Express · MongoDB</span>
        </div>
      </footer>
    </div>
  );
}
