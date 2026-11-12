"use client";

import Link from "next/link";
import { DashboardShell } from "./dashboard-shell";

export function TasterDashboard() {
  return (
    <DashboardShell role="TASTER" eyebrow="Taster dashboard" title="Your next delicious assignment, Jordan.">
      <section className="mt-10 grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
        <article className="rounded-[2.5rem] bg-[#f2b35b] p-7 shadow-[8px_8px_0_#d98a38] sm:p-9">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-[#fff1d7] px-3 py-1 text-xs font-black uppercase tracking-widest text-[#81451f]">You’re signed up</span>
              <h2 className="mt-5 text-4xl font-black tracking-[-0.06em] text-[#4c2b1d]">The Cozy Crunch</h2>
              <p className="mt-2 font-bold text-[#81451f]">Taste Day · December 12</p>
            </div>
            <span className="text-4xl" aria-hidden="true">🍪</span>
          </div>
          <div className="mt-8 rounded-3xl bg-[#fff1d7]/80 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-[#a15e2b]">Current status</p>
            <p className="mt-2 text-2xl font-black text-[#63351e]">Waiting for Taste Day</p>
            <p className="mt-1 text-sm text-[#81451f]">Your tasting room unlocks on December 12 at 10:00 AM.</p>
          </div>
          <button type="button" disabled className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-[#b98254] px-5 py-4 font-black text-[#fff1d7]/80">
            <span aria-hidden="true">🔒</span> Tasting Room locked
          </button>
        </article>
        <aside className="rounded-[2.5rem] border border-[#ead8c2] bg-[#fffaf3] p-7">
          <p className="text-xs font-black uppercase tracking-widest text-[#c36d2d]">Your preferences</p>
          <h2 className="mt-4 text-2xl font-black text-[#4c2b1d]">Matched with care</h2>
          <dl className="mt-6 space-y-4 text-sm">
            <div><dt className="font-black text-[#866b58]">Pickup location</dt><dd className="mt-1 font-bold">Maple Street Kitchen</dd></div>
            <div><dt className="font-black text-[#866b58]">Allergy restrictions</dt><dd className="mt-1 font-bold">Peanuts · Tree nuts</dd></div>
            <div><dt className="font-black text-[#866b58]">You like</dt><dd className="mt-1 font-bold">Chewy · Cinnamon · Chocolate</dd></div>
          </dl>
          <Link href="/taster/preferences" className="mt-7 inline-flex text-sm font-black text-[#c36d2d] underline decoration-2 underline-offset-4">Edit preferences →</Link>
        </aside>
      </section>
      <section className="mt-8 rounded-3xl border border-dashed border-[#d9c2a8] p-6 text-center">
        <p className="text-sm font-black uppercase tracking-widest text-[#c36d2d]">What happens next?</p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#866b58]">We’ll match you with cookies that are safe for you to taste. On Taste Day, each baker stays anonymous so every score starts fresh.</p>
      </section>
    </DashboardShell>
  );
}
