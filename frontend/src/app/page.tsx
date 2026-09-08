import Link from "next/link";
import Image from "next/image";
import { Source_Serif_4 } from "next/font/google";
import {
  Stethoscope,
  Users,
  Search,
  BarChart3,
  ShieldCheck,
  Link2,
  Filter,
  LayoutGrid,
  Server,
  Database,
  Globe,
  ArrowRight,
} from "lucide-react";
import { LandingNav } from "@/components/landing/LandingNav";

const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const CAPABILITIES = [
  { icon: ShieldCheck, label: "Secure authenticated access" },
  { icon: Search, label: "Searchable & paginated records" },
  { icon: BarChart3, label: "MongoDB-backed live analytics" },
  { icon: LayoutGrid, label: "Responsive on desktop & mobile" },
];

const FEATURES = [
  {
    icon: Stethoscope,
    title: "Doctor Management",
    description:
      "Create, edit, and remove doctor records (name, specialization, hospital, phone, and email) with a searchable, filterable, paginated list and a detail view for each doctor.",
  },
  {
    icon: Users,
    title: "Patient Management",
    description:
      "Create, edit, reassign, search, filter, paginate, and remove patient records from a dedicated patients workspace that spans every doctor.",
  },
  {
    icon: Filter,
    title: "Search & Filtering",
    description:
      "Full-text search plus specialization, hospital, condition, doctor, and date-range filters, combinable and reflected in the URL so a filtered view can be bookmarked or shared.",
  },
  {
    icon: Link2,
    title: "Doctor–Patient Relationships",
    description:
      "Add a patient directly from a doctor's record, or reassign an existing one to a different doctor from the patients page. The relationship stays correct everywhere it's shown.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Doctor and patient totals, a patients-per-doctor breakdown, condition distribution, and new-patient trends over 7, 30, or 90 days, computed by the database, not assembled in the browser.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Authentication",
    description:
      "JWT sessions in an httpOnly cookie, issued and verified only by the Express API. Every doctor, patient, and dashboard request is authenticated server-side before data comes back.",
  },
];

const WORKFLOW = [
  { title: "Authenticate", description: "Sign in; the API issues a session cookie only it can read." },
  { title: "Manage doctors", description: "Add a doctor, or search, filter, and page through the roster." },
  { title: "Manage patients", description: "Add a patient under a doctor, or edit and reassign from the patients page." },
  { title: "Search & filter", description: "Narrow either list by specialization, condition, doctor, or date." },
  { title: "Review analytics", description: "Totals, trends, and breakdowns computed live from the same data." },
];

const ENGINEERING_POINTS = [
  "Compound and text indexes matched to the actual query patterns: a doctor's patient list, condition filters, date-range sorts.",
  "Every request validated with Zod at the API boundary; errors return a consistent shape, never a raw stack trace.",
  "Helmet, locked-down CORS, and rate-limited login on the API; TanStack Query manages all server state on the frontend.",
  "Backend integration tests (Jest + Supertest) and frontend component tests, both written against real request/response behavior.",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_45%_at_50%_-5%,color-mix(in_oklch,var(--primary)_8%,transparent),transparent)]"
        />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" />
              Built for hospital front-desk operations
            </span>
            <h1
              className={`${serif.className} mt-5 text-4xl leading-[1.15] font-semibold tracking-tight text-balance sm:text-5xl`}
            >
              Every doctor, every patient,{" "}
              <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
                one clear view
              </span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground text-pretty">
              Doctor Tracker is a secure admin console for managing doctors and their patients, with fast
              search, real filtering, and a live analytics dashboard, built for the pace of a real clinic.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                Sign In to Dashboard
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex h-11 items-center rounded-xl border bg-background px-6 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
                src="/dashboard-hero.png"
                alt="Doctor Tracker dashboard showing doctor and patient totals, a patients-per-doctor chart, and a new-patient trend chart"
                width={1920}
                height={926}
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
                <p className="text-muted-foreground">Every request verified server-side</p>
              </div>
            </div>
          </div>
        </div>

        {/* Capability strip */}
        <div className="border-t bg-muted/30">
          <div className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:grid-cols-4 sm:px-6">
            {CAPABILITIES.map((c, i) => {
              const borderOnMobile = i === 1 || i === 3;
              const borderOnDesktop = i !== 0;
              return (
                <div
                  key={c.label}
                  className={`flex items-center gap-2.5 py-5 pl-4 text-sm sm:pl-6 ${
                    borderOnMobile ? "border-l" : "border-l-0"
                  } ${borderOnDesktop ? "sm:border-l" : "sm:border-l-0"}`}
                >
                  <c.icon className="size-4 shrink-0 text-primary" strokeWidth={2} />
                  <span className="text-foreground/90">{c.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className={`${serif.className} text-3xl font-semibold tracking-tight`}>
            Everything the front desk needs
          </h2>
          <p className="mt-3 text-muted-foreground">
            A focused feature set, built end to end. Every card below describes behavior that exists in the
            running application.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-5" strokeWidth={2} />
              </div>
              <h3 className="mt-4 font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Engineering */}
      <section id="analytics" className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-xl text-center">
            <h2 className={`${serif.className} text-3xl font-semibold tracking-tight`}>
              Built around real data, not static screens
            </h2>
            <p className="mt-3 text-muted-foreground">
              Next.js renders the interface; a standalone Express API owns every query, validation rule, and
              security check; MongoDB holds the data.
            </p>
          </div>

          {/* Architecture flow */}
          <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-3">
            {[
              { icon: Globe, label: "Browser", sub: "Next.js on Vercel" },
              { icon: Server, label: "REST API", sub: "Express on Render" },
              { icon: Database, label: "MongoDB Atlas", sub: "Indexed collections" },
            ].map((node, i, arr) => (
              <div key={node.label} className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
                <div className="flex w-full items-center gap-3 rounded-xl border bg-card px-5 py-4 sm:w-56">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <node.icon className="size-4.5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{node.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{node.sub}</p>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="size-4 shrink-0 rotate-90 text-muted-foreground sm:rotate-0" />
                )}
              </div>
            ))}
          </div>

          <ul className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
            {ENGINEERING_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 rounded-lg border bg-card p-4 text-sm">
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Workflow */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className={`${serif.className} text-3xl font-semibold tracking-tight`}>How it works</h2>
          <p className="mt-3 text-muted-foreground">Five steps from sign-in to a full operational picture.</p>
        </div>
        <ol className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-5">
          {WORKFLOW.map((step, i) => (
            <li key={step.title} className="relative border-t-2 border-primary/20 pt-4 first:border-primary">
              <span className="text-sm font-semibold text-primary">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-1.5 text-sm font-medium">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Final CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className={`${serif.className} text-2xl font-semibold tracking-tight sm:text-3xl`}>
            Explore Doctor Tracker
          </h2>
          <p className="mx-auto mt-2.5 max-w-md text-muted-foreground">
            Sign in to explore the working application.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Sign In to Dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xs">
              <span className="flex items-center gap-2 font-semibold">
                <Stethoscope className="size-4 text-primary" />
                Doctor Tracker
              </span>
              <p className="mt-2 text-sm text-muted-foreground">
                A secure admin console for managing doctors, their patients, and a live analytics view of the
                practice.
              </p>
            </div>
            <nav className="flex gap-8 text-sm">
              <div className="flex flex-col gap-2">
                <span className="font-medium text-foreground">Product</span>
                <a href="#features" className="text-muted-foreground transition-colors hover:text-foreground">
                  Features
                </a>
                <a href="#analytics" className="text-muted-foreground transition-colors hover:text-foreground">
                  Analytics
                </a>
                <Link href="/login" className="text-muted-foreground transition-colors hover:text-foreground">
                  Sign In
                </Link>
              </div>
            </nav>
          </div>
          <div className="mt-8 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>Doctor Tracker: a secure admin console for managing doctors and their patients.</span>
            <span>Built with Next.js, Express, and MongoDB.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
