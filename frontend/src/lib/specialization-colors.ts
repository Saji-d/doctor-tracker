import type { ComponentType } from "react";
import { Heart, Droplet, Brain, Bone, Baby, Stethoscope } from "lucide-react";

// Centralized specialization -> color/icon mapping, one fixed entry per
// value in lib/constants.ts's SPECIALIZATIONS list, each drawing a distinct
// hue from the theme's chart-1..6 ramp. Mirrors condition-colors.ts's
// approach: identity-based, not positional, so a specialization is always
// the same color everywhere it's shown.
export interface SpecializationStyle {
  icon: ComponentType<{ className?: string }>;
  badgeClassName: string;
  iconClassName: string;
}

const SPECIALIZATION_STYLES: Record<string, SpecializationStyle> = {
  Cardiology: {
    icon: Heart,
    badgeClassName: "border-[var(--chart-1)]/25 bg-[var(--chart-1)]/10 text-[var(--chart-1)]",
    iconClassName: "text-[var(--chart-1)]",
  },
  Dermatology: {
    icon: Droplet,
    badgeClassName: "border-[var(--chart-2)]/25 bg-[var(--chart-2)]/10 text-[var(--chart-2)]",
    iconClassName: "text-[var(--chart-2)]",
  },
  Pediatrics: {
    icon: Baby,
    badgeClassName: "border-[var(--chart-3)]/25 bg-[var(--chart-3)]/10 text-[var(--chart-3)]",
    iconClassName: "text-[var(--chart-3)]",
  },
  Neurology: {
    icon: Brain,
    badgeClassName: "border-[var(--chart-4)]/25 bg-[var(--chart-4)]/10 text-[var(--chart-4)]",
    iconClassName: "text-[var(--chart-4)]",
  },
  Orthopedics: {
    icon: Bone,
    badgeClassName: "border-[var(--chart-5)]/25 bg-[var(--chart-5)]/10 text-[var(--chart-5)]",
    iconClassName: "text-[var(--chart-5)]",
  },
  "General Medicine": {
    icon: Stethoscope,
    badgeClassName: "border-[var(--chart-6)]/25 bg-[var(--chart-6)]/10 text-[var(--chart-6)]",
    iconClassName: "text-[var(--chart-6)]",
  },
};

const OTHER_SPECIALIZATION_STYLE: SpecializationStyle = {
  icon: Stethoscope,
  badgeClassName: "border-border bg-muted text-muted-foreground",
  iconClassName: "text-muted-foreground",
};

export function getSpecializationStyle(specialization: string): SpecializationStyle {
  return SPECIALIZATION_STYLES[specialization] ?? OTHER_SPECIALIZATION_STYLE;
}
