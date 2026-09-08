"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { LayoutDashboard, Stethoscope, Users, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/patients", label: "Patients", icon: Users },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Stethoscope className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-tight">Doctor Tracker</p>
        <p className="truncate text-xs text-muted-foreground">Doctor &amp; patient records, organized</p>
      </div>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 px-3">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// A small, static info card — no data fetching, purely copy — that fills
// the gap between the nav links and the illustration so that area reads as
// intentionally designed rather than empty. "All systems operational" here
// is fixed branding copy, not a live status check (the Dashboard page's own
// System Status card is what reflects real backend health).
function SidebarWorkspaceCard() {
  return (
    <div className="hidden px-4 py-2 lg:block xl:px-5">
      <div className="rounded-xl border bg-muted/30 p-3.5">
        <p className="text-sm font-semibold">Care Workspace</p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">
          Keep doctor and patient records organized in one place.
        </p>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-success">
          <span className="size-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
          All systems operational
        </div>
      </div>
    </div>
  );
}

// A small illustration so the sidebar's lower half doesn't read as empty
// space on tall viewports — purely decorative placement, real artwork.
function SidebarIllustration() {
  return (
    <div className="hidden px-4 py-2 lg:block xl:px-5">
      <div className="rounded-xl bg-muted/40 p-3 text-center">
        <Image
          src="/images/sidebar-illustration.png"
          alt="Illustration of a doctor holding a clipboard, with the caption “Healthy people build brighter tomorrows.”"
          width={175}
          height={203}
          className="mx-auto h-auto w-full max-w-[170px] object-contain"
        />
      </div>
    </div>
  );
}

function SidebarFooter() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleLogout() {
    await apiClient.post("/auth/logout");
    queryClient.setQueryData(["auth", "me"], undefined);
    router.push("/login");
  }

  return (
    <div className="border-t p-3">
      <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5">
        <span className="truncate text-xs text-muted-foreground" title={user?.email}>
          {user?.email}
        </span>
        <Button variant="ghost" size="icon-sm" aria-label="Log out" onClick={handleLogout} className="shrink-0">
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function SidebarShell({ onNavigate, footer = true }: { onNavigate?: () => void; footer?: boolean }) {
  return (
    <>
      <Brand />
      <SidebarNav onNavigate={onNavigate} />
      <SidebarWorkspaceCard />
      <SidebarIllustration />
      {footer && <SidebarFooter />}
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-card">
      <SidebarShell />
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        render={<Button variant="ghost" size="icon-sm" aria-label="Open navigation menu" className="lg:hidden" />}
      >
        <Menu className="size-5" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col bg-card shadow-lg outline-none data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left">
          <DialogPrimitive.Title className="sr-only">Navigation menu</DialogPrimitive.Title>
          <SidebarShell onNavigate={() => setOpen(false)} />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
