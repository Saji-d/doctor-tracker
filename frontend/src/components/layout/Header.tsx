"use client";

import { usePathname } from "next/navigation";
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

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6 lg:px-8">
      <MobileNav />
      <span className="text-sm font-semibold">{pageTitle(pathname)}</span>
    </header>
  );
}
