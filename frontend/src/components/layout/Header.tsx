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

// Mobile-only: the sidebar (brand, nav, and the user/logout footer) is
// hidden below the `lg` breakpoint, so this is the only way to reach the
// nav drawer there. At `lg` and up the sidebar is already visible, so this
// entire bar — including the old breadcrumb/user-identity row it used to
// carry — renders nothing, rather than leaving an empty strip above the
// page content.
export function Header() {
  const pathname = usePathname();
  const title = pageTitle(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden">
      <MobileNav />
      <span className="truncate text-sm font-semibold">{title}</span>
    </header>
  );
}
