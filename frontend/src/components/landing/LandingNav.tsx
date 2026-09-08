"use client";

import { useState } from "react";
import Link from "next/link";
import { Stethoscope, Menu, X } from "lucide-react";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#analytics", label: "Analytics" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <span className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Stethoscope className="size-4.5" />
          </span>
          Doctor Tracker
        </span>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden sm:block">
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Sign In
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex size-9 items-center justify-center rounded-lg border text-foreground transition-colors hover:bg-muted sm:hidden"
        >
          {open ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
        </button>
      </div>

      {open && (
        <div className="border-t bg-background px-4 py-4 sm:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign In
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
