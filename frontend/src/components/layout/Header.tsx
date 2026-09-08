"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { MobileNav } from "@/components/layout/Sidebar";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/doctors": "Doctors",
  "/patients": "Patients",
};

function pageTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/doctors/")) return "Doctor Detail";
  if (pathname.startsWith("/doctors")) return "Doctors";
  if (pathname.startsWith("/patients")) return "Patients";
  return "Doctor Tracker";
}

export function Header() {
  const pathname = usePathname();
  const title = pageTitle(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 min-w-0">
        <MobileNav />
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          <Link href="/dashboard" aria-label="Dashboard" className="flex items-center hover:text-foreground">
            <Home className="size-4" />
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate font-semibold text-foreground">{title}</span>
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          S
        </span>
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-medium">Sajid</p>
          <p className="text-xs text-muted-foreground">Administrator</p>
        </div>
      </div>
    </header>
  );
}
