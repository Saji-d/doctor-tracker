"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Debounced 300ms so keystrokes don't trigger a fetch (and a table re-render)
// on every character — only the value committed via onChange affects the
// query key that actually drives the network request.
export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  const [local, setLocal] = useState(value);
  // Adjust local state when the `value` prop changes externally (e.g. "Clear
  // filters") — done during render, per React's guidance, rather than in an
  // effect, to avoid an extra cascading render.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setLocal(value);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <Input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder={placeholder ?? "Search..."}
      className="max-w-xs"
    />
  );
}
