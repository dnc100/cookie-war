"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/auth-context";
import { getAssignedCookiesForTaster, type TastingCookie } from "../lib/tasting-room-repository";
import { ReviewCard } from "./review-card";

export function TastingRoom({ battleId }: { battleId: string }) {
  const { user } = useAuth();
  const [cookies, setCookies] = useState<TastingCookie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAssignments() {
      if (!user || user.role !== "TASTER") {
        setError("Only signed-in tasters can access the tasting room.");
        setIsLoading(false);
        return;
      }

      try {
        const assignments = await getAssignedCookiesForTaster(battleId, user.id);
        if (active) setCookies(assignments);
      } catch {
        if (active) setError("We couldn’t load your cookie assignments. Please try again.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadAssignments();
    return () => {
      active = false;
    };
  }, [battleId, user]);

  if (isLoading) {
    return <div className="rounded-[2rem] bg-[#fffaf3] p-8 text-center font-bold text-[#866b58]">Loading your tasting flight...</div>;
  }

  if (error) {
    return <div role="alert" className="rounded-[2rem] border border-red-200 bg-red-50 p-6 font-bold text-red-800">{error}</div>;
  }

  return (
    <div>
      <div className="rounded-[2rem] bg-[#f2b35b] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#81451f]">Taste kindly</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#4c2b1d]">Your tasting flight</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#63351e]">These cookies are anonymous by design. Score each one on its own merits, then save your thoughts before moving on.</p>
        <p className="mt-5 text-sm font-black text-[#81451f]">{cookies.length} cookies assigned</p>
      </div>
      {cookies.length === 0 ? (
        <div className="mt-6 rounded-[2rem] border border-dashed border-[#d9c2a8] p-8 text-center text-[#866b58]">No cookies have been assigned yet.</div>
      ) : (
        <div className="mt-6 space-y-6">
          {cookies.map((cookie) => <ReviewCard key={cookie.assignmentId} cookie={cookie} />)}
        </div>
      )}
    </div>
  );
}
