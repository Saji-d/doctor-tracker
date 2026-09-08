"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Tone = "primary" | "info" | "success" | "warning" | "purple";

// "purple" reuses the theme's existing chart-4 token (already a purple hue
// in both light/dark palettes) rather than inventing a new CSS variable —
// it's the one card tone that isn't already covered by a semantic token.
const TONE_ICON: Record<Tone, string> = {
  primary: "bg-primary/15 text-primary",
  info: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  purple: "bg-[var(--chart-4)]/15 text-[var(--chart-4)]",
};

const TONE_CARD: Record<Tone, string> = {
  primary: "bg-primary/8 border-primary/25",
  info: "bg-info/8 border-info/25",
  success: "bg-success/8 border-success/25",
  warning: "bg-warning/8 border-warning/25",
  purple: "bg-[var(--chart-4)]/8 border-[var(--chart-4)]/25",
};

interface Trend {
  label: string;
  direction?: "up" | "down";
}

interface StatCardProps {
  label: string;
  value: number | string;
  isLoading?: boolean;
  icon?: ComponentType<{ className?: string }>;
  tone?: Tone;
  trend?: Trend;
  caption?: string;
  href?: string;
  onClick?: () => void;
  actionLabel?: string;
}

export function StatCard({
  label,
  value,
  isLoading,
  icon: Icon,
  tone = "primary",
  trend,
  caption,
  href,
  onClick,
  actionLabel = "View details",
}: StatCardProps) {
  const interactive = Boolean(href || onClick);

  const card = (
    <Card size="sm" className={cn("relative h-full overflow-hidden transition-shadow hover:shadow-md", TONE_CARD[tone])}>
      <CardHeader className="pb-1.5">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon && (
          <CardAction>
            <div className={cn("flex size-8 items-center justify-center rounded-lg", TONE_ICON[tone])}>
              <Icon className="size-4" />
            </div>
          </CardAction>
        )}
      </CardHeader>
      {/* flex-1 + justify-between: the value stays near the top and the
          footer slot stays pinned to a consistent position near the bottom,
          regardless of whether trend/caption text is present — this is what
          keeps all four cards' internals aligned once they're forced to the
          same height by the grid + `h-full` above. */}
      <CardContent className="flex flex-1 flex-col justify-between">
        <div>
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          )}
        </div>
        <div className="mt-1 min-h-[1.125rem]">
          {!isLoading && trend && (
            <p
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.direction === "down" ? "text-destructive" : "text-success"
              )}
            >
              {trend.direction === "down" ? (
                <TrendingDown className="size-3.5 shrink-0" />
              ) : (
                <TrendingUp className="size-3.5 shrink-0" />
              )}
              <span className="truncate">{trend.label}</span>
            </p>
          )}
          {!isLoading && !trend && caption && <p className="truncate text-xs text-muted-foreground">{caption}</p>}
        </div>
      </CardContent>
      {interactive && (
        <ArrowRight
          aria-hidden="true"
          className="absolute right-4 bottom-4 size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        />
      )}
    </Card>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={`${label}: ${value}. ${actionLabel}`}
        className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {card}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${label}: ${value}. ${actionLabel}`}
        className="group block h-full w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {card}
      </button>
    );
  }

  return card;
}
