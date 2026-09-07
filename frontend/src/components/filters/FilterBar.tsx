"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface FilterBarProps {
  children: ReactNode;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function FilterBar({ children, onClear, hasActiveFilters }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {children}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
