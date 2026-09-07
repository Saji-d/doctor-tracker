"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "./api-client";

interface User {
  email: string;
}

// "network-error" is distinct from "unauthenticated": a 401 from /auth/me
// genuinely means "not logged in" (redirect to /login), but a status-0
// ApiClientError means the backend couldn't be reached at all — the user
// may well still be logged in, so redirecting them to the login page would
// be misleading. That case gets its own graceful error state instead.
type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "network-error";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  refetch: UseQueryResult["refetch"];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiClient.get<{ user: User }>("/auth/me"),
    retry: false,
  });

  let status: AuthStatus;
  if (isLoading) {
    status = "loading";
  } else if (data) {
    status = "authenticated";
  } else if (error instanceof ApiClientError && error.status === 0) {
    status = "network-error";
  } else {
    status = "unauthenticated";
  }

  const value: AuthContextValue = {
    status,
    user: data?.user ?? null,
    refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
