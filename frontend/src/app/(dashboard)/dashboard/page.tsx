"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleLogout() {
    await apiClient.post("/auth/logout");
    queryClient.setQueryData(["auth", "me"], undefined);
    router.push("/login");
  }

  return (
    <div className="p-8 space-y-4">
      <p className="text-sm">
        Logged in as <span className="font-medium">{user?.email}</span>
      </p>
      <Button onClick={handleLogout} variant="outline">
        Log out
      </Button>
    </div>
  );
}
