"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiClient } from "./api-client";

interface User {
  email: string;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  refetch: UseQueryResult["refetch"];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiClient.get<{ user: User }>("/auth/me"),
    retry: false,
  });

  const status: AuthStatus = isLoading ? "loading" : data ? "authenticated" : "unauthenticated";

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
