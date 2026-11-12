"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell } from "./dashboard-shell";
import { BattleTimeline } from "./timeline";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
import { useAuth } from "../context/auth-context";

export function BakerDashboard() {
  const { user } = useAuth();
  const [battles, setBattles] = useState<Array<{ id: string; name: string; genre: string; submissions_close_at: string; taste_day_at: string; results_day_at: string }>>([]);

  useEffect(() => {
    let active = true;
    void getSupabaseBrowserClient()
      .from("battles")
      .select("id, name, genre, submissions_close_at, taste_day_at, results_day_at")
      .in("status", ["DRAFT", "OPEN"])
      .order("taste_day_at", { ascending: true })
      .then(({ data }) => {
        if (active) setBattles(data ?? []);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardShell role="BAKER" eyebrow="Baker dashboard" title={`Ready to make your mark, ${user?.displayName ?? "baker"}?`}>
      {battles.length === 0 ? <section className="mt-10 rounded-[2.5rem] bg-[#174f72] p-8 text-white"><h2 className="text-3xl font-black">No competitions are open yet.</h2><p className="mt-2 text-[#d9edf5]">The next competition will appear here when an admin creates it.</p></section> : battles.map((battle) => <section key={battle.id} className="mt-10 overflow-hidden rounded-[2.5rem] bg-[#174f72] p-7 text-white shadow-[8px_8px_0_#8fc5d9] sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <span className="rounded-full bg-[#b8e4f2] px-3 py-1 text-xs font-black uppercase tracking-widest text-[#174f72]">Active competition</span>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.06em] sm:text-6xl">{battle.name}</h2>
            <p className="mt-3 max-w-xl text-[#d9edf5]">Bring your best {battle.genre.toLowerCase()} and choose any pickup location that works for you.</p>
          </div>
          <div className="rounded-3xl bg-[#123b55] px-5 py-4 text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-[#b8e4f2]">Taste day</p>
            <p className="mt-1 font-black">{new Date(battle.taste_day_at).toLocaleDateString()}</p>
          </div>
        </div>
        <BattleTimeline submissionDeadline={new Date(battle.submissions_close_at).toLocaleDateString()} tasteDay={new Date(battle.taste_day_at).toLocaleDateString()} resultsDay={new Date(battle.results_day_at).toLocaleDateString()} />
        <Link href={`/baker/battles/${battle.id}/submit`} className="mt-8 inline-flex items-center rounded-full bg-[#b8e4f2] px-6 py-4 font-black text-[#123b55] transition hover:-translate-y-0.5 hover:bg-white">
          View competition <span className="ml-3">→</span>
        </Link>
      </section>)}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {["Recipe stays yours", "Up to 3 questions", "Blind tasting"].map((item) => (
          <div key={item} className="rounded-3xl border border-[#ead8c2] bg-[#fffaf3] p-5">
            <p className="text-lg font-black text-[#174f72]">{item}</p>
            <p className="mt-2 text-sm text-[#866b58]">You’re in control of your bake.</p>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
