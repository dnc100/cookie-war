"use client";

import { useEffect, useState, type FormEvent } from "react";
import { DashboardShell } from "./dashboard-shell";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

type Battle = {
  id: string;
  name: string;
  genre: string;
  status: string;
  submissions_close_at: string;
  taste_day_at: string;
  results_day_at: string;
  judging_criteria: string[];
};

type BakerRosterEntry = {
  user_id: string;
  display_name: string;
  email: string;
  location_name: string;
  location_address: string;
  location_latitude: number | null;
  location_longitude: number | null;
  joined_at: string;
};

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"setup" | "logistics">("setup");
  const [battles, setBattles] = useState<Battle[]>([]);
  const [selectedBattleId, setSelectedBattleId] = useState("");
  const [roster, setRoster] = useState<BakerRosterEntry[]>([]);
  const [editingBattle, setEditingBattle] = useState<Battle | null>(null);
  const [battleName, setBattleName] = useState("");
  const [genre, setGenre] = useState("Cookies");
  const [battleDate, setBattleDate] = useState("");
  const [submissionDate, setSubmissionDate] = useState("");
  const [resultsDate, setResultsDate] = useState("");
  const [criteria, setCriteria] = useState("Taste, Texture, Appearance");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const loadBattles = async () => {
    const { data, error: queryError } = await getSupabaseBrowserClient()
      .from("battles")
      .select("id, name, genre, status, submissions_close_at, taste_day_at, results_day_at, judging_criteria")
      .order("taste_day_at", { ascending: true });
    if (queryError) throw queryError;
    const nextBattles = (data ?? []) as Battle[];
    setBattles(nextBattles);
    setSelectedBattleId((current) => current || nextBattles[0]?.id || "");
  };

  const loadRoster = async (battleId: string) => {
    if (!battleId) {
      setRoster([]);
      return;
    }
    const { data, error: queryError } = await getSupabaseBrowserClient()
      .from("battle_participants")
      .select("user_id, joined_at, location_name, location_address, location_latitude, location_longitude, profiles(display_name, email)")
      .eq("battle_id", battleId)
      .eq("role", "BAKER")
      .order("joined_at", { ascending: true });
    if (queryError) throw queryError;
    setRoster((data ?? []).map((entry) => {
      const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
      return {
        user_id: entry.user_id,
        joined_at: entry.joined_at,
        display_name: profile?.display_name ?? "Unnamed baker",
        email: profile?.email ?? "",
        location_name: entry.location_name ?? "Location not selected",
        location_address: entry.location_address ?? "",
        location_latitude: entry.location_latitude,
        location_longitude: entry.location_longitude,
      };
    }));
  };

  useEffect(() => {
    let active = true;
    // The effect subscribes to an async database read and guards stale responses.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBattles().catch((caught) => {
      if (active) setError(caught instanceof Error ? caught.message : "Could not load competitions.");
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (activeTab !== "logistics") return;
    // The effect refreshes the selected competition's logistics roster.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRoster(selectedBattleId).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Could not load the baker roster.");
    });
  }, [activeTab, selectedBattleId]);

  const resetForm = () => {
    setEditingBattle(null);
    setBattleName("");
    setGenre("Cookies");
    setBattleDate("");
    setSubmissionDate("");
    setResultsDate("");
    setCriteria("Taste, Texture, Appearance");
  };

  const edit = (battle: Battle) => {
    setEditingBattle(battle);
    setBattleName(battle.name);
    setGenre(battle.genre);
    setBattleDate(battle.taste_day_at.slice(0, 10));
    setSubmissionDate(battle.submissions_close_at.slice(0, 10));
    setResultsDate(battle.results_day_at.slice(0, 10));
    setCriteria(battle.judging_criteria.join(", "));
    setActiveTab("setup");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (battle: Battle) => {
    if (!window.confirm(`Delete "${battle.name}"? This removes its submissions and roster.`)) return;
    const { error: deleteError } = await getSupabaseBrowserClient().from("battles").delete().eq("id", battle.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    if (selectedBattleId === battle.id) setSelectedBattleId("");
    await loadBattles();
  };

  const saveBattle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const payload = {
        name: battleName.trim(),
        genre: genre.trim(),
        taste_day_at: `${battleDate}T12:00:00.000Z`,
        submissions_close_at: `${submissionDate}T12:00:00.000Z`,
        results_day_at: `${resultsDate}T12:00:00.000Z`,
        judging_criteria: criteria.split(",").map((item) => item.trim()).filter(Boolean),
        status: "OPEN",
      };
      if (editingBattle) {
        const { error: updateError } = await supabase.from("battles").update(payload).eq("id", editingBattle.id);
        if (updateError) throw updateError;
      } else {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) throw new Error("You must be signed in as an admin.");
        const { error: insertError } = await supabase.from("battles").insert({ ...payload, created_by: authData.user.id });
        if (insertError) throw insertError;
      }
      setCreated(true);
      resetForm();
      await loadBattles();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The competition could not be saved.");
    }
  };

  return (
    <DashboardShell role="ADMIN" eyebrow="Admin control room" title="Run the competition clearly.">
      {error && <p role="alert" className="mt-8 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{error}</p>}
      <div className="mt-10 flex gap-2 rounded-2xl bg-[#ead8c2] p-1">
        <button type="button" onClick={() => setActiveTab("setup")} className={`flex-1 rounded-xl px-4 py-3 text-sm font-black ${activeTab === "setup" ? "bg-[#81451f] text-[#fffaf3]" : "text-[#81451f]"}`}>Competitions</button>
        <button type="button" onClick={() => setActiveTab("logistics")} className={`flex-1 rounded-xl px-4 py-3 text-sm font-black ${activeTab === "logistics" ? "bg-[#81451f] text-[#fffaf3]" : "text-[#81451f]"}`}>Baker logistics</button>
      </div>

      {activeTab === "setup" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <form onSubmit={saveBattle} className="rounded-[2rem] border border-[#ead8c2] bg-[#fffaf3] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#c36d2d]">{editingBattle ? "Edit competition" : "New competition"}</p><h2 className="mt-2 text-3xl font-black text-[#4c2b1d]">{editingBattle ? "Update the fight" : "Define the fight"}</h2></div>{editingBattle && <button type="button" onClick={resetForm} className="text-sm font-bold text-[#866b58] underline">Cancel</button>}</div>
            <div className="mt-6 space-y-5">
              <Field label="Competition name" value={battleName} onChange={setBattleName} placeholder="e.g. The Cozy Crunch" />
              <Field label="Genre" value={genre} onChange={setGenre} placeholder="Cookies, cakes, pies..." />
              <div><label htmlFor="battle-date" className="text-sm font-black text-[#63351e]">Taste day</label><input id="battle-date" required type="date" value={battleDate} onChange={(event) => setBattleDate(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#dfcbb5] bg-[#fffdf9] px-4 py-3" /></div>
              <div><label htmlFor="submission-date" className="text-sm font-black text-[#63351e]">Submission deadline</label><input id="submission-date" required type="date" value={submissionDate} onChange={(event) => setSubmissionDate(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#dfcbb5] bg-[#fffdf9] px-4 py-3" /></div>
              <div><label htmlFor="results-date" className="text-sm font-black text-[#63351e]">Results day</label><input id="results-date" required type="date" value={resultsDate} onChange={(event) => setResultsDate(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#dfcbb5] bg-[#fffdf9] px-4 py-3" /></div>
              <Field label="Judging criteria" value={criteria} onChange={setCriteria} placeholder="Taste, Texture, Appearance" />
            </div>
            {created && <p role="status" className="mt-5 rounded-2xl bg-[#edffd1] px-4 py-3 text-sm font-bold text-[#42551d]">Competition saved and open for baker signups.</p>}
            <button type="submit" className="mt-6 rounded-full bg-[#81451f] px-6 py-4 font-black text-[#fffaf3]">{editingBattle ? "Save changes →" : "Create competition →"}</button>
          </form>
          <section className="rounded-[2rem] border border-[#ead8c2] bg-[#fffaf3] p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c36d2d]">Saved competitions</p>
            <div className="mt-5 space-y-3">{isLoading ? <p className="text-sm text-[#866b58]">Loading...</p> : battles.length === 0 ? <p className="text-sm text-[#866b58]">No competitions yet.</p> : battles.map((battle) => <article key={battle.id} className="rounded-2xl bg-[#f7efe3] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-[#4c2b1d]">{battle.name}</h3><p className="mt-1 text-sm text-[#866b58]">{battle.genre} · submissions {new Date(battle.submissions_close_at).toLocaleDateString()} · taste {new Date(battle.taste_day_at).toLocaleDateString()} · results {new Date(battle.results_day_at).toLocaleDateString()}</p><p className="mt-2 text-xs font-bold text-[#866b58]">{battle.judging_criteria.join(" · ")}</p></div><span className="rounded-full bg-[#d8ff88] px-2 py-1 text-[10px] font-black uppercase">{battle.status}</span></div><div className="mt-4 flex gap-3"><button type="button" onClick={() => edit(battle)} className="text-sm font-black text-[#81451f] underline">Edit</button><button type="button" onClick={() => void remove(battle)} className="text-sm font-black text-red-700 underline">Delete</button></div></article>)}</div>
          </section>
        </div>
      ) : (
        <section className="mt-6 rounded-[2rem] border border-[#ead8c2] bg-[#fffaf3] p-6 sm:p-8">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#c36d2d]">Pickup overview</p><h2 className="mt-2 text-3xl font-black text-[#4c2b1d]">Every baker, every location</h2><p className="mt-3 text-sm text-[#866b58]">There is no baker-to-taster matching. This is your pickup roster.</p></div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">{battles.map((battle) => <button key={battle.id} type="button" onClick={() => setSelectedBattleId(battle.id)} className={`rounded-2xl border p-4 text-left ${selectedBattleId === battle.id ? "border-[#81451f] bg-[#f7e5cd]" : "border-[#ead8c2] bg-[#f7efe3]"}`}><p className="font-black text-[#4c2b1d]">{battle.name}</p><p className="mt-1 text-sm text-[#866b58]">{battle.genre} · {new Date(battle.taste_day_at).toLocaleDateString()}</p></button>)}</div>
          <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-[#ead8c2] text-xs uppercase tracking-widest text-[#866b58]"><tr><th className="pb-3">Baker</th><th className="pb-3">Email</th><th className="pb-3">Chosen pickup</th><th className="pb-3">Coordinates</th><th className="pb-3">Signed up</th></tr></thead><tbody className="divide-y divide-[#f0e2d2]">{roster.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-[#866b58]">Select a competition to see its bakers.</td></tr> : roster.map((baker) => <tr key={baker.user_id}><td className="py-4 font-black">{baker.display_name}</td><td className="py-4">{baker.email}</td><td className="py-4 font-bold">{baker.location_name}<span className="block text-xs font-normal text-[#866b58]">{baker.location_address}</span></td><td className="py-4 text-xs text-[#866b58]">{baker.location_latitude && baker.location_longitude ? `${baker.location_latitude.toFixed(4)}, ${baker.location_longitude.toFixed(4)}` : "Not pinned"}</td><td className="py-4 text-[#866b58]">{new Date(baker.joined_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>
        </section>
      )}
    </DashboardShell>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div><label className="text-sm font-black text-[#63351e]">{label}</label><input required value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-[#dfcbb5] bg-[#fffdf9] px-4 py-3" /></div>;
}
