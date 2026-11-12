"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "../context/auth-context";
import type { UserRole } from "../types/domain";

const roleLabels: Record<UserRole, string> = {
  BAKER: "Baker",
  TASTER: "Taster",
  ADMIN: "Admin",
};

export function DashboardShell({
  role,
  eyebrow,
  title,
  children,
}: {
  role: UserRole;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  const { user, isLoading, signOut, switchMode } = useAuth();
  const router = useRouter();
  const activeRole = user?.activeMode ?? role;

  return (
    <main className={`min-h-screen text-[#35271f] ${role === "BAKER" ? "bg-[#edf7fb]" : role === "TASTER" ? "bg-[#f7efe3]" : "bg-[#f7efe3]"}`}>
      <header className="border-b border-[#e7d8c5] bg-[#fffaf3]/90">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="text-2xl font-black tracking-[-0.08em] text-[#85451f]">
            cookie<span className="text-[#e59a36]">!</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm font-bold text-[#6d4c37]">{user.displayName}</span>
                {user.role === "ADMIN" && <Link href="/admin/dashboard" className="text-xs font-black text-[#a75c2b]">Admin</Link>}
                {user.role !== "ADMIN" && user.canBake && user.canTaste && <button type="button" onClick={() => { const nextMode = activeRole === "BAKER" ? "TASTER" : "BAKER"; void switchMode(nextMode).then(() => router.push(nextMode === "BAKER" ? "/baker/dashboard" : "/taster/dashboard")); }} className="rounded-full bg-[#b8e4f2] px-3 py-2 text-xs font-black text-[#174f72]">Switch to {activeRole === "BAKER" ? "taster" : "baker"}</button>}
                <button type="button" onClick={signOut} className="rounded-full border border-[#dfcbb5] px-3 py-2 text-xs font-bold text-[#6d4c37]">Sign out</button>
              </>
            ) : <Link href="/auth" className="rounded-full bg-[#d8ff88] px-4 py-2 text-xs font-bold text-[#49391c]">Sign in</Link>}
          </div>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
        {isLoading ? (
          <section className="rounded-[2.5rem] border border-[#ead8c2] bg-[#fffaf3] p-8 text-center font-bold text-[#866b58]">Loading your account...</section>
        ) : activeRole !== role ? (
          <section className="rounded-[2.5rem] border border-[#ead8c2] bg-[#fffaf3] p-8 text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c36d2d]">Role-based access</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-[#4c2b1d]">This dashboard is for {roleLabels[role]}s.</h1>
            <p className="mx-auto mt-3 max-w-md text-[#866b58]">Sign in with an account that has the {roleLabels[role]} role to access this dashboard.</p>
          </section>
        ) : (
          <>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c36d2d]">{eyebrow}</p>
            <h1 className={`mt-3 max-w-3xl text-5xl font-black tracking-[-0.06em] sm:text-7xl ${role === "BAKER" ? "text-[#174f72]" : "text-[#4c2b1d]"}`}>{title}</h1>
            {children}
          </>
        )}
      </div>
    </main>
  );
}
