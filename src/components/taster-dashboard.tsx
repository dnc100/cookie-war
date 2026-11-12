"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Allergen } from "../types/domain";
import { DashboardShell } from "./dashboard-shell";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
import { useAuth } from "../context/auth-context";

type Battle = {
  id: string;
  name: string;
  genre: string;
  submissions_close_at: string;
  taste_day_at: string;
  results_day_at: string;
};

type Participation = {
  battle_id: string;
  location_name: string | null;
  location_address: string | null;
  allergy_tags: Allergen[] | null;
};

const allergens: Array<{ value: Allergen; label: string }> = [
  { value: "PEANUT", label: "Peanuts" },
  { value: "TREE_NUT", label: "Tree nuts" },
  { value: "DAIRY", label: "Dairy" },
  { value: "GLUTEN", label: "Gluten" },
  { value: "EGG", label: "Eggs" },
  { value: "SOY", label: "Soy" },
  { value: "SESAME", label: "Sesame" },
];

export function TasterDashboard() {
  const { user } = useAuth();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [participation, setParticipation] = useState<Record<string, Participation>>({});
  const [expandedBattle, setExpandedBattle] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [selectedAllergens, setSelectedAllergens] = useState<Allergen[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const [{ data: battlesData }, { data: authData }] = await Promise.all([
        supabase.from("battles").select("id, name, genre, submissions_close_at, taste_day_at, results_day_at").in("status", ["OPEN", "TASTING"]).order("taste_day_at", { ascending: true }),
        supabase.auth.getUser(),
      ]);
      if (!authData.user || !active) return;
      const { data: participationData } = await supabase.from("battle_participants").select("battle_id, location_name, location_address, allergy_tags").eq("user_id", authData.user.id).eq("role", "TASTER");
      if (active) {
        setBattles(battlesData ?? []);
        setParticipation(Object.fromEntries((participationData ?? []).map((item) => [item.battle_id, item])));
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const editParticipation = (battleId: string) => {
    const current = participation[battleId];
    setExpandedBattle(battleId);
    setLocationName(current?.location_name ?? "");
    setLocationAddress(current?.location_address ?? "");
    setSelectedAllergens(current?.allergy_tags ?? []);
    setMessage(null);
  };

  const saveParticipation = async (battleId: string) => {
    const supabase = getSupabaseBrowserClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setMessage("Please sign in again before joining.");
      return;
    }
    if (!locationName.trim() || !locationAddress.trim()) {
      setMessage("Add a pickup location and address.");
      return;
    }
    const { data, error } = await supabase.from("battle_participants").upsert({
      battle_id: battleId,
      user_id: authData.user.id,
      role: "TASTER",
      location_name: locationName.trim(),
      location_address: locationAddress.trim(),
      allergy_tags: selectedAllergens,
    }).select("battle_id, location_name, location_address, allergy_tags").single();
    if (error) {
      setMessage(error.message);
      return;
    }
    setParticipation((current) => ({ ...current, [battleId]: data }));
    setExpandedBattle(null);
    setMessage("Your taster details are saved.");
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Location is not available in this browser.");
      return;
    }

    setIsLocating(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      setLocationAddress("Finding address...");
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`);
        if (!response.ok) throw new Error("Address lookup failed.");
        const result = await response.json() as { display_name?: string };
        if (!result.display_name) throw new Error("No address was found for this location.");
        setLocationAddress(result.display_name);
        setLocationName((current) => current || "My current location");
      } catch (caught) {
        setLocationAddress("");
        setMessage(caught instanceof Error ? caught.message : "Could not find an address.");
      } finally {
        setIsLocating(false);
      }
    }, () => {
      setIsLocating(false);
      setMessage("We could not access your location. Check your browser permission.");
    });
  };

  const removeParticipation = async (battleId: string) => {
    const supabase = getSupabaseBrowserClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setMessage("Please sign in again before withdrawing.");
      return;
    }
    const { error } = await supabase.from("battle_participants").delete()
      .eq("battle_id", battleId)
      .eq("user_id", authData.user.id)
      .eq("role", "TASTER");
    if (error) {
      setMessage(error.message);
      return;
    }
    setParticipation((current) => {
      const next = { ...current };
      delete next[battleId];
      return next;
    });
    setMessage("You have left this competition.");
  };

  return (
    <DashboardShell role="TASTER" eyebrow="Taster dashboard" title={`Ready to taste, ${user?.displayName ?? "taster"}?`}>
      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-[#4c2b1d]">Open competitions</h2>
            <p className="mt-2 text-[#866b58]">Choose a competition, then tell us where to send your tasting box and what to keep out.</p>
          </div>
          <Link href="/taster/preferences" className="hidden text-sm font-black text-[#c36d2d] underline sm:block">Preferences</Link>
        </div>
        {message && <p role="status" className="mt-5 rounded-2xl bg-[#edffd1] px-5 py-4 text-sm font-bold text-[#42551d]">{message}</p>}
        <div className="mt-6 grid gap-5">
          {battles.length === 0 && <section className="rounded-[2.5rem] border border-[#ead8c2] bg-[#fffaf3] p-8 text-[#866b58]">No competitions are open for tasting yet.</section>}
          {battles.map((battle) => {
            const joined = participation[battle.id];
            const isEditing = expandedBattle === battle.id;
            return (
              <article key={battle.id} className="rounded-[2.5rem] bg-[#f2b35b] p-7 shadow-[8px_8px_0_#d98a38] sm:p-9">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="rounded-full bg-[#fff1d7] px-3 py-1 text-xs font-black uppercase tracking-widest text-[#81451f]">{joined ? "You’re signed up" : "Open for tasters"}</span>
                    <h3 className="mt-5 text-4xl font-black tracking-[-0.06em] text-[#4c2b1d]">{battle.name}</h3>
                    <p className="mt-2 font-bold text-[#81451f]">{battle.genre} · Taste day {new Date(battle.taste_day_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-4xl" aria-hidden="true">🍪</span>
                </div>
                {joined && !isEditing && <div className="mt-6 rounded-3xl bg-[#fff1d7]/80 p-5 text-sm text-[#63351e]"><p className="font-black">Tasting location: {joined.location_name}</p><p className="mt-1">{joined.location_address}</p><p className="mt-2">Allergies: {joined.allergy_tags?.length ? joined.allergy_tags.join(" · ") : "None listed"}</p></div>}
                {isEditing && <div className="mt-6 space-y-4 rounded-3xl bg-[#fff1d7]/80 p-5">
                  <label className="block text-sm font-black text-[#63351e]">Location name<input value={locationName} onChange={(event) => setLocationName(event.target.value)} placeholder="Home, office, or pickup point" className="mt-2 w-full rounded-2xl border border-[#dfcbb5] bg-white px-4 py-3 font-normal" /></label>
                  <label className="block text-sm font-black text-[#63351e]">Address<input value={locationAddress} onChange={(event) => setLocationAddress(event.target.value)} placeholder="Street address" className="mt-2 w-full rounded-2xl border border-[#dfcbb5] bg-white px-4 py-3 font-normal" /></label>
                  <button type="button" disabled={isLocating} onClick={useMyLocation} className="rounded-full bg-[#1d668c] px-4 py-3 font-black text-white">{isLocating ? "Finding address..." : "Use my address"}</button>
                  <fieldset><legend className="text-sm font-black text-[#63351e]">Allergies</legend><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{allergens.map((allergen) => <label key={allergen.value} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedAllergens.includes(allergen.value)} onChange={() => setSelectedAllergens((current) => current.includes(allergen.value) ? current.filter((value) => value !== allergen.value) : [...current, allergen.value])} />{allergen.label}</label>)}</div></fieldset>
                  <button type="button" onClick={() => void saveParticipation(battle.id)} className="rounded-full bg-[#4c2b1d] px-5 py-3 font-black text-white">Save my taster details</button>
                </div>}
                {!isEditing && <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => editParticipation(battle.id)} className="rounded-full bg-[#4c2b1d] px-5 py-3 font-black text-white">{joined ? "Edit my details" : "Sign up to taste"}</button>{joined && <button type="button" onClick={() => void removeParticipation(battle.id)} className="rounded-full border-2 border-[#4c2b1d] px-5 py-3 font-black text-[#4c2b1d]">Remove my entrance</button>}</div>}
              </article>
            );
          })}
        </div>
      </section>
    </DashboardShell>
  );
}
