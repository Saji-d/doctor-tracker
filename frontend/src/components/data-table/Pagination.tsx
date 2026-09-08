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

// Always includes page 1, the last page, and a window around the current
// page; "ellipsis" fills any gap so the control stays a compact, fixed-ish
// width instead of listing every page for large result sets.
function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  // Small page counts (the common case here) just show every page, matching
  // the reference design's plain [1][2][3] — ellipsis only kicks in once
  // there are enough pages that showing them all would crowd the control.
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const keep = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(p);
  });
  return result;
}

export function Pagination({ page, totalPages, onChange, total, limit, itemLabel = "results" }: PaginationProps) {
  if (totalPages <= 1) return null;

  const rangeStart = limit ? (page - 1) * limit + 1 : undefined;
  const rangeEnd = limit && total ? Math.min(page * limit, total) : undefined;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <p className="text-sm text-muted-foreground">
        {rangeStart && rangeEnd && total !== undefined
          ? `Showing ${rangeStart}–${rangeEnd} of ${total} ${itemLabel}`
          : `Page ${page} of ${totalPages}`}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="size-3.5" />
        </Button>
        {pageWindow(page, totalPages).map((p, i) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="icon-sm"
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              onClick={() => onChange(p)}
            >
              {p}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
