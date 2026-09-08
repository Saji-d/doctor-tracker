"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { status, refetch } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (status === "network-error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Could not reach server — check your connection</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    // Redirect is in flight (see effect above) — render nothing.
    return null;
  }

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      {/* min-w-0 on both: flex items default to min-width:auto, which lets a
          wide table (or anything else) grow the whole page horizontally
          instead of scrolling within its own overflow-x-auto container. */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-64">
        <Header />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
