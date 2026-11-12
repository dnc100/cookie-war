"use client";

import { useEffect, useState } from "react";
import type { ResultsEntry } from "../lib/calculate-winner";

function Confetti() {
  const colors = ["#d8ff88", "#f5b95a", "#e9c6ed", "#86b9bb", "#e57348"];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 28 }, (_, index) => (
        <span key={index} className="absolute h-3 w-2 animate-[fall_3s_ease-in-out_infinite] rounded-sm" style={{ left: `${(index * 37) % 100}%`, top: `${(index * 17) % 35}%`, backgroundColor: colors[index % colors.length], animationDelay: `${(index % 8) * 0.18}s`, transform: `rotate(${index * 29}deg)` }} />
      ))}
    </div>
  );
}

export function ResultsPage({ entries }: { entries: ResultsEntry[] }) {
  const [revealed, setRevealed] = useState(false);
  const winner = entries[0];

  useEffect(() => {
    const timer = window.setTimeout(() => setRevealed(true), 500);
    return () => window.clearTimeout(timer);
  }, []);

  if (!winner) {
    return <div className="rounded-[2rem] bg-[#fffaf3] p-8 text-center font-bold text-[#866b58]">Results are not ready yet.</div>;
  }

  return (
    <div className="relative overflow-hidden">
      <Confetti />
      <section className="relative rounded-[2.5rem] bg-[#81451f] px-6 py-12 text-center text-[#fffaf3] shadow-[8px_8px_0_#e59a36] sm:px-10">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#d8ff88]">Results Day</p>
        <h1 className="mt-4 text-5xl font-black tracking-[-0.07em] sm:text-7xl">And the winner is...</h1>
        <div className={`mx-auto mt-8 max-w-xl transition-all duration-700 ${revealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
          <div className="text-6xl" aria-hidden="true">👑</div>
          <p className="mt-4 text-2xl font-black text-[#f5b95a]">{winner.tastingLabel} was...</p>
          <h2 className="mt-2 text-4xl font-black text-[#d8ff88] sm:text-6xl">{winner.bakerName}&apos;s {winner.cookieName}!</h2>
          <p className="mt-5 text-lg text-[#f9ddaf]">{winner.averages.overall}/10 overall · {winner.reviewCount} reviews</p>
        </div>
      </section>

      <section className="relative mt-10">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#c36d2d]">The final bake-off</p><h2 className="mt-2 text-3xl font-black text-[#4c2b1d]">Leaderboard</h2></div>
          <span className="text-2xl" aria-hidden="true">🏆</span>
        </div>
        <div className="mt-5 space-y-3">
          {entries.map((entry, index) => (
            <article key={entry.submissionId} className={`flex items-center gap-4 rounded-3xl p-5 ${index === 0 ? "bg-[#f2b35b]" : "border border-[#ead8c2] bg-[#fffaf3]"}`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#81451f] font-black text-[#fffaf3]">{index === 0 ? "👑" : index + 1}</span>
              <div className="min-w-0 flex-1"><p className="font-black text-[#4c2b1d]">{entry.tastingLabel} · {entry.bakerName}</p><p className="truncate text-sm text-[#866b58]">{entry.cookieName}</p></div>
              <p className="text-xl font-black text-[#c36d2d]">{entry.averages.overall}<span className="text-xs text-[#866b58]">/10</span></p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative mt-10 rounded-[2rem] border border-[#ead8c2] bg-[#fffaf3] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c36d2d]">Straight from the tasters</p>
        <h2 className="mt-2 text-3xl font-black text-[#4c2b1d]">Your feedback</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {entries.map((entry) => (
            <div key={entry.submissionId} className="rounded-3xl bg-[#f7efe3] p-5">
              <h3 className="font-black text-[#81451f]">{entry.bakerName}&apos;s {entry.cookieName}</h3>
              <div className="mt-4 space-y-4">
                {entry.feedbackQuestions.map((question) => (
                  <div key={question.prompt}><p className="text-sm font-black text-[#63351e]">{question.prompt}</p><ul className="mt-2 space-y-2">{question.answers.map((answer, answerIndex) => <li key={`${question.prompt}-${answerIndex}`} className="rounded-2xl bg-[#fffaf3] px-3 py-2 text-sm text-[#866b58]">“{answer}”</li>)}</ul></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
