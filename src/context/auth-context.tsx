"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserRole } from "../types/domain";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

export interface AuthUser {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  activeMode: "BAKER" | "TASTER" | "ADMIN";
  canBake: boolean;
  canTaste: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  switchMode: (mode: "BAKER" | "TASTER") => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ));

  useEffect(() => {
    let active = true;
    let supabase: ReturnType<typeof getSupabaseBrowserClient> | null = null;

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return;
    supabase = getSupabaseBrowserClient();

    const loadUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        if (active) setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, role, active_mode, can_bake, can_taste")
        .eq("id", authData.user.id)
        .single();

      if (active) {
        const role = (profile?.role as UserRole | undefined) ?? "TASTER";
        const canBake = Boolean(profile?.can_bake || role === "BAKER");
        const canTaste = Boolean(profile?.can_taste || role === "BAKER" || role === "TASTER");
        setUser({
          id: authData.user.id,
          displayName: profile?.display_name ?? authData.user.email?.split("@")[0] ?? "User",
          email: authData.user.email ?? "",
          role,
          activeMode: role === "ADMIN"
            ? "ADMIN"
            : profile?.active_mode === "BAKER" && canBake
              ? "BAKER"
              : "TASTER",
          canBake,
          canTaste,
        });
        setIsLoading(false);
      }
    };

    void loadUser();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => void loadUser());
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      signIn: async (email, password) => {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signOut: () => {
        const supabase = getSupabaseBrowserClient();
        void supabase.auth.signOut();
        setUser(null);
      },
      switchMode: async (mode) => {
        if (!user || user.role === "ADMIN") return;
        if (mode === "BAKER" && !user.canBake) throw new Error("This account does not have baker access.");
        if (mode === "TASTER" && !user.canTaste) throw new Error("This account does not have taster access.");
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.from("profiles").update({ active_mode: mode }).eq("id", user.id);
        if (error) throw error;
        setUser((current) => current ? { ...current, activeMode: mode } : current);
      },
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
