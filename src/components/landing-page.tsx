"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/auth-context";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

const roles = [
  {
    title: "Bake",
    description: "Bring your best batch and ask the questions you’re curious about.",
    accent: "bg-[#d8ff88]",
  },
  {
    title: "Taste",
    description: "Discover local talent, one anonymous cookie at a time.",
    accent: "bg-[#e9c6ed]",
  },
];

function getTimeRemaining(nextBattleAt: Date | null) {
  const milliseconds = Math.max(0, (nextBattleAt?.getTime() ?? Date.now()) - Date.now());
  const totalMinutes = Math.floor(milliseconds / 60000);

  return [
    Math.floor(totalMinutes / (60 * 24)),
    Math.floor((totalMinutes % (60 * 24)) / 60),
    totalMinutes % 60,
  ].map((value) => String(value).padStart(2, "0"));
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none">
      <path d="M4 10h11M10.5 5.5 15 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CookieIllustration() {
  return (
    <div className="relative mx-auto h-52 w-52" aria-hidden="true">
      <div className="absolute inset-5 rotate-[-12deg] rounded-full bg-[#d8ff88] shadow-[inset_-8px_-10px_0_#afd965]" />
      <div className="absolute inset-9 rotate-[8deg] rounded-full border-[3px] border-[#62632c] bg-[#c48a52]">
        <span className="absolute left-9 top-8 h-4 w-4 rounded-full bg-[#62632c]" />
        <span className="absolute right-10 top-12 h-3 w-3 rounded-full bg-[#62632c]" />
        <span className="absolute bottom-10 left-16 h-5 w-5 rounded-full bg-[#62632c]" />
        <span className="absolute bottom-8 right-7 h-3 w-3 rounded-full bg-[#62632c]" />
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-[#f7f0e5] px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#62632c]">
        #004
      </div>
    </div>
  );
}

export function LandingPage() {
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState(["00", "00", "00"]);
  const [nextBattleAt, setNextBattleAt] = useState<Date | null>(null);
  const [nextBattle, setNextBattle] = useState({ name: "Your next competition", genre: "baking", submissionDate: "", resultsDate: "" });
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    const notice = sessionStorage.getItem("cookie-war-auth-notice");
    const noticeTimer = window.setTimeout(() => {
      if (notice) setAuthNotice(notice);
    });
    if (notice) sessionStorage.removeItem("cookie-war-auth-notice");

    const loadBattle = async () => {
      const { data, error } = await getSupabaseBrowserClient()
        .from("battles")
        .select("name, genre, submissions_close_at, taste_day_at, results_day_at")
        .in("status", ["OPEN", "TASTING"])
        .order("taste_day_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("Could not load the next competition.", error);
        return;
      }
      if (data) {
        setNextBattle({ name: data.name, genre: data.genre, submissionDate: new Date(data.submissions_close_at).toLocaleDateString(), resultsDate: new Date(data.results_day_at).toLocaleDateString() });
        setNextBattleAt(new Date(data.taste_day_at));
      }
    };
    void loadBattle();
    return () => window.clearTimeout(noticeTimer);
  }, []);

  useEffect(() => {
    const updateCountdown = () => setTimeRemaining(getTimeRemaining(nextBattleAt));
    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 60_000);

    return () => window.clearInterval(intervalId);
  }, [nextBattleAt]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#86b9bb] px-5 py-5 text-[#27251f] sm:px-8">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href={user ? (user.activeMode === "ADMIN" ? "/admin/dashboard" : user.activeMode === "TASTER" ? "/taster/dashboard" : "/baker/dashboard") : "/"} className="text-2xl font-black tracking-[-0.08em] text-[#f7f0e5]">
          cookie<span className="text-[#d8ff88]">!</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/auth" className="hidden rounded-full px-4 py-2 text-sm font-bold text-[#f7f0e5] sm:inline">
            Log in
          </Link>
          <Link href="/auth?mode=signup" className="rounded-full bg-[#d8ff88] px-5 py-3 text-sm font-bold text-[#3d4422] transition hover:-translate-y-0.5">
            Join the bake
          </Link>
        </div>
      </nav>
      {authNotice && <p role="status" className="mx-auto mt-6 max-w-6xl rounded-2xl bg-[#edffd1] px-5 py-4 text-sm font-bold text-[#42551d]">{authNotice}</p>}

      <section className="mx-auto grid max-w-6xl items-center gap-10 pb-16 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:pb-24 lg:pt-24">
        <div>
          <p className="mb-5 inline-flex rounded-full bg-[#62632c] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#d8ff88]">
            Local baking battles
          </p>
          <h1 className="max-w-3xl text-6xl font-black leading-[0.88] tracking-[-0.07em] text-[#f7f0e5] sm:text-8xl">
            Bake boldly.
            <br />
            Taste kindly.
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-7 text-[#f7f0e5]/85">
            Cookie War! brings neighbors together for friendly, blind-tasting
            competitions where every batch gets a fair shot.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/auth?mode=signup&role=baker" className="inline-flex items-center gap-3 rounded-full bg-[#d8ff88] px-6 py-4 font-bold text-[#3d4422] transition hover:gap-4">
              I&apos;m a baker <ArrowIcon />
            </Link>
            <Link href="/auth?mode=signup&role=taster" className="inline-flex items-center gap-3 rounded-full border-2 border-[#f7f0e5]/70 px-6 py-4 font-bold text-[#f7f0e5] transition hover:bg-[#f7f0e5] hover:text-[#3d4422]">
              I&apos;m a taster <ArrowIcon />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="rounded-[3rem] bg-[#f7f0e5] px-7 pb-7 pt-8 shadow-[10px_12px_0_#62632c]">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[#e9c6ed] px-3 py-1 text-xs font-bold uppercase tracking-wider">Next battle</span>
              <span className="text-sm font-bold text-[#62632c]">{nextBattleAt ? nextBattleAt.toLocaleDateString() : "Coming soon"}</span>
            </div>
            <CookieIllustration />
            <div className="text-center">
              <h2 className="text-3xl font-black tracking-tight">{nextBattle.name}</h2>
              <p className="mt-2 text-sm text-[#62632c]">The next local {nextBattle.genre.toLowerCase()} competition.</p>
              {nextBattle.submissionDate && <p className="mt-3 text-xs font-bold text-[#62632c]">Submit by {nextBattle.submissionDate} · Results {nextBattle.resultsDate}</p>}
            </div>
            <div className="mt-7 grid grid-cols-3 gap-2 text-center">
              {timeRemaining.map((value, index) => (
                <div key={`${value}-${index}`} className="rounded-2xl bg-[#e9e4d8] px-2 py-3">
                  <div className="text-2xl font-black">{value}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#62632c]">
                    {["days", "hrs", "mins"][index]}
                  </div>
                </div>
              ))}
            </div>
            <Link href="/auth?mode=signup" className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#62632c] py-3 font-bold text-[#d8ff88]">
              See the battle <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 pb-8 sm:grid-cols-2">
        {roles.map((role) => (
          <article key={role.title} className={`${role.accent} rounded-[2rem] p-7`}>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#62632c]">For the community</p>
            <h2 className="mt-10 text-4xl font-black tracking-[-0.06em]">{role.title}</h2>
            <p className="mt-2 max-w-sm text-[#3d4422]">{role.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default LandingPage;
