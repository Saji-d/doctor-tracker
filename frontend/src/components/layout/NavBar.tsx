"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/doctors", label: "Doctors" },
  { href: "/patients", label: "Patients" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  async function handleLogout() {
    await apiClient.post("/auth/logout");
    queryClient.setQueryData(["auth", "me"], undefined);
    router.push("/login");
  }

  return (
    <nav className="border-b bg-background">
      <div className="flex flex-wrap items-center gap-1 px-4 sm:px-8 py-2 min-h-14">
        <span className="flex items-center gap-2 font-semibold mr-4">
          <Stethoscope className="size-4.5 text-primary" aria-hidden="true" />
          Doctor Tracker
        </span>
        {LINKS.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {link.label}
            </Link>
          );
        })}
        <div className="ml-auto flex items-center gap-3">
          {user?.email && <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </div>
    </nav>
  );
}
