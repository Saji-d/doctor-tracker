// Centralized condition -> color mapping, shared by the "Top Patient
// Conditions" chart and the Recent Patients condition badges so a given
// condition is always the same color everywhere it appears. Colors are tied
// to the condition's identity, not its current rank/count, so a condition
// doesn't change color just because its count moved it up or down a list.
//
// All 10 of the app's currently seeded conditions get a fixed hue, one each
// from the theme's chart-1..10 ramp. Any other condition — one not in this
// list — falls back to a neutral gray, which is also the correct treatment
// for a chart's overflow "Others" bucket.
export interface ConditionColor {
  /** CSS color value, for chart marks (pie slices, legend dots). */
  chart: string;
  /** Tailwind classes for a colored badge (bg/text/border). */
  badgeClassName: string;
}

const CONDITION_COLORS: Record<string, ConditionColor> = {
  "Common Cold": {
    chart: "var(--chart-1)",
    badgeClassName: "border-[var(--chart-1)]/25 bg-[var(--chart-1)]/10 text-[var(--chart-1)]",
  },
  Migraine: {
    chart: "var(--chart-2)",
    badgeClassName: "border-[var(--chart-2)]/25 bg-[var(--chart-2)]/10 text-[var(--chart-2)]",
  },
  Arthritis: {
    chart: "var(--chart-3)",
    badgeClassName: "border-[var(--chart-3)]/25 bg-[var(--chart-3)]/10 text-[var(--chart-3)]",
  },
  Asthma: {
    chart: "var(--chart-4)",
    badgeClassName: "border-[var(--chart-4)]/25 bg-[var(--chart-4)]/10 text-[var(--chart-4)]",
  },
  Hypertension: {
    chart: "var(--chart-5)",
    badgeClassName: "border-[var(--chart-5)]/25 bg-[var(--chart-5)]/10 text-[var(--chart-5)]",
  },
  // A distinct teal — previously fell back to the same neutral gray as
  // every other unmapped condition, which made it hard to tell apart from
  // e.g. "Diabetes Type 2" or "Back Pain" in the Recent Patients/Patients
  // tables.
  Eczema: {
    chart: "var(--chart-6)",
    badgeClassName: "border-[var(--chart-6)]/25 bg-[var(--chart-6)]/10 text-[var(--chart-6)]",
  },
  "Diabetes Type 2": {
    chart: "var(--chart-7)",
    badgeClassName: "border-[var(--chart-7)]/25 bg-[var(--chart-7)]/10 text-[var(--chart-7)]",
  },
  "Anxiety Disorder": {
    chart: "var(--chart-8)",
    badgeClassName: "border-[var(--chart-8)]/25 bg-[var(--chart-8)]/10 text-[var(--chart-8)]",
  },
  "Back Pain": {
    chart: "var(--chart-9)",
    badgeClassName: "border-[var(--chart-9)]/25 bg-[var(--chart-9)]/10 text-[var(--chart-9)]",
  },
  "Allergic Rhinitis": {
    chart: "var(--chart-10)",
    badgeClassName: "border-[var(--chart-10)]/25 bg-[var(--chart-10)]/10 text-[var(--chart-10)]",
  },
};

const OTHER_CONDITION_COLOR: ConditionColor = {
  chart: "var(--muted-foreground)",
  badgeClassName: "border-border bg-muted text-muted-foreground",
};

export function getConditionColor(condition: string): ConditionColor {
  return CONDITION_COLORS[condition] ?? OTHER_CONDITION_COLOR;
}
