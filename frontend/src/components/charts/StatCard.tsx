"use client";

import type { ComponentType } from "react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Tone = "primary" | "info" | "success" | "warning";

const TONE_CLASSES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

interface StatCardProps {
  label: string;
  value: number | string;
  isLoading?: boolean;
  icon?: ComponentType<{ className?: string }>;
  tone?: Tone;
}

export function StatCard({ label, value, isLoading, icon: Icon, tone = "primary" }: StatCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon && (
          <CardAction>
            <div className={cn("flex size-8 items-center justify-center rounded-md", TONE_CLASSES[tone])}>
              <Icon className="size-4" />
            </div>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-3xl font-semibold tabular-nums">{value}</p>}
      </CardContent>
    </Card>
  );
}
