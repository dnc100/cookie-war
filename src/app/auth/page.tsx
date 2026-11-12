"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("BAKER");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const routeAuthenticatedUser = useCallback(async (userId: string) => {
    const supabase = getSupabaseBrowserClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user || authData.user.id !== userId || !authData.user.email_confirmed_at) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active_mode, can_bake")
      .eq("id", userId)
      .single();
    const destination = profile?.role === "ADMIN"
      ? "/admin/dashboard"
      : profile?.active_mode === "BAKER" && (profile.can_bake || profile.role === "BAKER")
        ? "/baker/dashboard"
        : profile?.role === "TASTER"
          ? "/taster/dashboard"
          : "/baker/dashboard";
    router.replace(destination);
    router.refresh();
  }, [router]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const params = new URLSearchParams(window.location.search);
    const setupTimer = window.setTimeout(() => {
      if (params.get("mode") === "signup") setMode("sign-up");
      if (params.get("role")?.toLowerCase() === "taster") setRole("TASTER");
    });

    void supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email_confirmed_at) void routeAuthenticatedUser(data.user.id);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user.email_confirmed_at) {
        void routeAuthenticatedUser(session.user.id);
      }
    });
    return () => {
      window.clearTimeout(setupTimer);
      subscription.subscription.unsubscribe();
    };
  }, [routeAuthenticatedUser]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const result = mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { displayName, role } } });

      if (result.error) throw result.error;
      if (mode === "sign-up" && !result.data.session) {
        sessionStorage.setItem("cookie-war-auth-notice", "Your account was created but is not verified yet. Check your email, then use the confirmation link to open your dashboard.");
        router.replace("/");
        return;
      }
      const signedInUser = result.data.user;
      const { data: profile } = signedInUser
        ? await supabase.from("profiles").select("role, active_mode, can_bake").eq("id", signedInUser.id).single()
        : { data: null };
      const destination = profile?.role === "ADMIN"
        ? "/admin/dashboard"
        : profile?.active_mode === "BAKER" && (profile.can_bake || profile.role === "BAKER")
          ? "/baker/dashboard"
          : profile?.role === "TASTER" || role === "TASTER"
          ? "/taster/dashboard"
          : "/baker/dashboard";
      router.replace(destination);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-[#86b9bb] px-5 py-12 text-[#27251f]">
      <section className="mx-auto max-w-md rounded-[2.5rem] bg-[#f7f0e5] p-7 shadow-[10px_12px_0_#62632c] sm:p-9">
        <Link href="/" className="text-2xl font-black tracking-[-0.08em] text-[#62632c]">cookie<span className="text-[#d8ff88]">!</span></Link>
        <h1 className="mt-10 text-4xl font-black tracking-[-0.06em]">{mode === "sign-in" ? "Welcome back." : "Join the bake."}</h1>
        <p className="mt-2 text-sm text-[#62632c]">Use a real account to access your Cookie War dashboard.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === "sign-up" && <input required value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" className="w-full rounded-2xl border border-[#d8cdbd] bg-white/70 px-4 py-3 outline-none" />}
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="w-full rounded-2xl border border-[#d8cdbd] bg-white/70 px-4 py-3 outline-none" />
          <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password (8+ characters)" className="w-full rounded-2xl border border-[#d8cdbd] bg-white/70 px-4 py-3 outline-none" />
          {mode === "sign-up" && (
            <select value={role} onChange={(event) => setRole(event.target.value)} className="w-full rounded-2xl border border-[#d8cdbd] bg-white/70 px-4 py-3">
              <option value="BAKER">I&apos;m a baker</option>
              <option value="TASTER">I&apos;m a taster</option>
            </select>
          )}
          {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{error}</p>}
          {message && <p role="status" className="rounded-2xl bg-[#edffd1] px-4 py-3 text-sm font-bold text-[#42551d]">{message}</p>}
          <button type="submit" className="w-full rounded-full bg-[#d8ff88] px-5 py-4 font-black text-black">{mode === "sign-in" ? "Sign in" : "Create account"}</button>
        </form>
        <button type="button" onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")} className="mt-5 text-sm font-bold text-[#62632c] underline">
          {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}
