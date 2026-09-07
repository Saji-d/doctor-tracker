"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  total?: number;
  limit?: number;
  itemLabel?: string;
}

export function Pagination({ page, totalPages, onChange, total, limit, itemLabel = "results" }: PaginationProps) {
  if (totalPages <= 1) return null;

  const rangeStart = limit ? (page - 1) * limit + 1 : undefined;
  const rangeEnd = limit && total ? Math.min(page * limit, total) : undefined;

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-sm text-muted-foreground">
        {rangeStart && rangeEnd && total !== undefined
          ? `Showing ${rangeStart}–${rangeEnd} of ${total} ${itemLabel}`
          : `Page ${page} of ${totalPages}`}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="size-3.5" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums">
          {page} / {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
