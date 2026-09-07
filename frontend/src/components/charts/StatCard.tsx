"use client";

import type { ComponentType } from "react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: number | string;
  isLoading?: boolean;
  icon?: ComponentType<{ className?: string }>;
}

export function StatCard({ label, value, isLoading, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon && (
          <CardAction>
            <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
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
