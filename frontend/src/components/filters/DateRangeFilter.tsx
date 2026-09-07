"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateRangeFilterProps {
  dateFrom: string;
  dateTo: string;
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
}

export function DateRangeFilter({ dateFrom, dateTo, onChangeFrom, onChangeTo }: DateRangeFilterProps) {
  return (
    <div className="flex items-end gap-2">
      <div className="space-y-1">
        <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
          From
        </Label>
        <Input
          id="dateFrom"
          type="date"
          value={dateFrom}
          onChange={(e) => onChangeFrom(e.target.value)}
          className="w-[150px]"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
          To
        </Label>
        <Input id="dateTo" type="date" value={dateTo} onChange={(e) => onChangeTo(e.target.value)} className="w-[150px]" />
      </div>
    </div>
  );
}
