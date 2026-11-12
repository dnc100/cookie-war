"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Allergen } from "../types/domain";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";

type SubmissionFormData = {
  cookieName: string;
  recipe: string;
  recipeIsSecret: boolean;
  allergens: Allergen[];
  dropOffLocationId: string;
  locationName: string;
  locationAddress: string;
  locationLatitude: number | null;
  locationLongitude: number | null;
  feedbackQuestions: string[];
};

type FormErrors = Partial<Record<"cookieName" | "dropOffLocationId" | "feedbackQuestions", string>>;

const allergenOptions: Array<{ value: Allergen; label: string }> = [
  { value: "PEANUT", label: "Nuts" },
  { value: "DAIRY", label: "Dairy" },
  { value: "GLUTEN", label: "Gluten" },
  { value: "SOY", label: "Soy" },
  { value: "EGG", label: "Eggs" },
];

function validate(values: SubmissionFormData): FormErrors {
  const errors: FormErrors = {};

  if (!values.cookieName.trim()) {
    errors.cookieName = "Give your cookie a name.";
  } else if (values.cookieName.trim().length < 2) {
    errors.cookieName = "Cookie names need at least 2 characters.";
  }

  if (!values.dropOffLocationId || !values.locationAddress.trim()) {
    errors.dropOffLocationId = "Choose where you’ll drop off your batch.";
  }

  if (values.feedbackQuestions.some((question) => !question.trim())) {
    errors.feedbackQuestions = "Finish or remove each feedback question.";
  }

  return errors;
}

export function CookieSubmissionForm({
  battleId,
  onSubmit,
}: {
  battleId: string;
  onSubmit?: (submission: SubmissionFormData) => void;
}) {
  const [values, setValues] = useState<SubmissionFormData>({
    cookieName: "",
    recipe: "",
    recipeIsSecret: true,
    allergens: [],
    dropOffLocationId: "",
    locationName: "",
    locationAddress: "",
    locationLatitude: null,
    locationLongitude: null,
    feedbackQuestions: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationLatitude, setLocationLatitude] = useState<number | null>(null);
  const [locationLongitude, setLocationLongitude] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const loadSubmission = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const { data, error } = await supabase.from("submissions").select("*").eq("battle_id", battleId).eq("baker_id", authData.user.id).maybeSingle();
      if (error) {
        if (active) setSubmitError(error.message);
        return;
      }
      if (!data || !active) return;
      const questions = Array.isArray(data.feedback_questions) ? data.feedback_questions : [];
      setExistingSubmission(true);
      setValues((current) => ({
        ...current,
        cookieName: data.cookie_name,
        recipe: data.recipe ?? "",
        recipeIsSecret: data.recipe_is_secret,
        allergens: data.allergy_tags ?? [],
        dropOffLocationId: data.drop_off_location_id ?? "custom",
        feedbackQuestions: questions.map((question: { prompt: string }) => question.prompt),
      }));
      const { data: participant } = await supabase.from("battle_participants").select("location_name, location_address, location_latitude, location_longitude").eq("battle_id", battleId).eq("user_id", authData.user.id).maybeSingle();
      if (participant && active) {
        setLocationName(participant.location_name ?? "");
        setLocationAddress(participant.location_address ?? "");
        setLocationLatitude(participant.location_latitude);
        setLocationLongitude(participant.location_longitude);
      }
    };
    void loadSubmission();
    return () => {
      active = false;
    };
  }, [battleId]);

  const updateValues = (patch: Partial<SubmissionFormData>) => {
    setValues((current) => ({ ...current, ...patch }));
    setSubmitted(false);
  };

  const addQuestion = () => {
    if (values.feedbackQuestions.length < 3) {
      updateValues({ feedbackQuestions: [...values.feedbackQuestions, ""] });
    }
  };

  const updateQuestion = (index: number, prompt: string) => {
    updateValues({
      feedbackQuestions: values.feedbackQuestions.map((question, questionIndex) =>
        questionIndex === index ? prompt : question,
      ),
    });
  };

  const removeQuestion = (index: number) => {
    updateValues({
      feedbackQuestions: values.feedbackQuestions.filter((_, questionIndex) => questionIndex !== index),
    });
  };

  const toggleAllergen = (allergen: Allergen) => {
    const allergens = values.allergens.includes(allergen)
      ? values.allergens.filter((item) => item !== allergen)
      : [...values.allergens, allergen];
    updateValues({ allergens });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate({ ...values, locationName, locationAddress, locationLatitude, locationLongitude });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitted(false);
      return;
    }

    const submission = {
      ...values,
      cookieName: values.cookieName.trim(),
      recipe: values.recipe.trim(),
      feedbackQuestions: values.feedbackQuestions.map((question) => question.trim()),
      locationName,
      locationAddress,
      locationLatitude,
      locationLongitude,
    };

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Please sign in before entering a competition.");

      const { error: participantError } = await supabase.from("battle_participants").upsert({
        battle_id: battleId,
        user_id: authData.user.id,
        role: "BAKER",
        location_id: null,
        location_name: submission.locationName.trim(),
        location_address: submission.locationAddress.trim(),
        location_latitude: submission.locationLatitude,
        location_longitude: submission.locationLongitude,
      });
      if (participantError) throw participantError;

      const { error: submissionError } = await supabase.from("submissions").upsert({
        battle_id: battleId,
        baker_id: authData.user.id,
        cookie_name: submission.cookieName,
        recipe: submission.recipe,
        recipe_is_secret: submission.recipeIsSecret,
        allergy_tags: submission.allergens,
        drop_off_location_id: null,
        feedback_questions: submission.feedbackQuestions.map((prompt, index) => ({ id: `question-${index + 1}`, prompt, order: index + 1 })),
      }, { onConflict: "battle_id,baker_id" });
      if (submissionError) throw submissionError;

      setSubmitError(null);
      setSubmitted(true);
      setExistingSubmission(true);
      onSubmit?.(submission);
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "Your entry could not be saved.");
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {submitted && (
        <div role="status" className="rounded-2xl border border-[#b7d77c] bg-[#edffd1] px-5 py-4 text-sm font-bold text-[#42551d]">
          Your cookie is ready for the battle roster!
        </div>
      )}
      {submitError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">{submitError}</div>}

      <section className="rounded-[2rem] border border-[#ead8c2] bg-[#fffaf3] p-6 sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c36d2d]">Your entry</p>
          <h2 className="mt-2 text-2xl font-black text-[#4c2b1d]">{existingSubmission ? "Edit your cookie" : "Tell us about your cookie"}</h2>
        </div>

        <label htmlFor="cookie-name" className="text-sm font-black text-[#63351e]">Cookie name <span aria-hidden="true">*</span></label>
        <input
          id="cookie-name"
          value={values.cookieName}
          onChange={(event) => updateValues({ cookieName: event.target.value })}
          aria-invalid={Boolean(errors.cookieName)}
          aria-describedby={errors.cookieName ? "cookie-name-error" : undefined}
          placeholder="e.g. Sea Salt Stardust"
          className="mt-2 w-full rounded-2xl border border-[#dfcbb5] bg-[#fffdf9] px-4 py-3 outline-none transition focus:border-[#d98932] focus:ring-2 focus:ring-[#f2b35b]/40 aria-[invalid=true]:border-red-400"
        />
        {errors.cookieName && <p id="cookie-name-error" className="mt-2 text-sm font-bold text-red-700">{errors.cookieName}</p>}

        <div className="mt-6">
          <label htmlFor="recipe" className="text-sm font-black text-[#63351e]">Recipe <span className="font-normal text-[#866b58]">(optional)</span></label>
          <textarea
            id="recipe"
            value={values.recipe}
            onChange={(event) => updateValues({ recipe: event.target.value })}
            rows={5}
            placeholder="Share the story or ingredients behind your batch..."
            className="mt-2 w-full resize-y rounded-2xl border border-[#dfcbb5] bg-[#fffdf9] px-4 py-3 outline-none transition focus:border-[#d98932] focus:ring-2 focus:ring-[#f2b35b]/40"
          />
          <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm font-bold text-[#63351e]">
            <input
              type="checkbox"
              checked={values.recipeIsSecret}
              onChange={(event) => updateValues({ recipeIsSecret: event.target.checked })}
              className="h-4 w-4 accent-[#c36d2d]"
            />
            Keep recipe secret until Results Day
          </label>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#ead8c2] bg-[#fffaf3] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c36d2d]">Safety first</p>
        <h2 className="mt-2 text-2xl font-black text-[#4c2b1d]">What’s in the batch?</h2>
        <p className="mt-2 text-sm text-[#866b58]">Select every allergen present so we can match tasters safely.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {allergenOptions.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#ead8c2] px-4 py-3 font-bold transition hover:border-[#d98932]">
              <input
                type="checkbox"
                checked={values.allergens.includes(option.value)}
                onChange={() => toggleAllergen(option.value)}
                className="h-4 w-4 accent-[#c36d2d]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#ead8c2] bg-[#fffaf3] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c36d2d]">Taste Day logistics</p>
        <h2 className="mt-2 text-2xl font-black text-[#4c2b1d]">Where will you drop off?</h2>
        <label htmlFor="location-name" className="text-sm font-black text-[#63351e]">Location name</label>
        <input id="location-name" required value={locationName} onChange={(event) => { setLocationName(event.target.value); updateValues({ dropOffLocationId: "custom" }); }} placeholder="e.g. My home, Maple Street Kitchen" className="mt-5 w-full rounded-2xl border border-[#dfcbb5] bg-[#fffdf9] px-4 py-3" />
        <label htmlFor="location-address" className="mt-4 block text-sm font-black text-[#63351e]">Address</label>
        <input id="location-address" required value={locationAddress} onChange={(event) => { setLocationAddress(event.target.value); updateValues({ dropOffLocationId: "custom" }); }}
          placeholder="Street address or pickup instructions"
          aria-invalid={Boolean(errors.dropOffLocationId)}
          aria-describedby={errors.dropOffLocationId ? "location-error" : undefined}
          className="mt-2 w-full rounded-2xl border border-[#dfcbb5] bg-[#fffdf9] px-4 py-3 outline-none focus:border-[#d98932] focus:ring-2 focus:ring-[#f2b35b]/40 aria-[invalid=true]:border-red-400"
        />
        <div className="mt-4 overflow-hidden rounded-2xl border border-[#c7dce9] bg-[#dcecf4]">
          <div className="relative h-36 bg-[linear-gradient(25deg,transparent_45%,#b4d2df_46%,#b4d2df_48%,transparent_49%),linear-gradient(150deg,transparent_45%,#b4d2df_46%,#b4d2df_48%,transparent_49%)]">
            <div className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#1d668c] text-lg text-white shadow-lg">●</div>
          </div>
          <div className="flex items-center justify-between gap-3 bg-white/70 px-4 py-3 text-xs text-[#24516b]">
            <span>{locationLatitude && locationLongitude ? `${locationLatitude.toFixed(5)}, ${locationLongitude.toFixed(5)}` : "Optional map pin"}</span>
            <button type="button" onClick={() => navigator.geolocation?.getCurrentPosition((position) => { setLocationLatitude(position.coords.latitude); setLocationLongitude(position.coords.longitude); })} className="rounded-full bg-[#1d668c] px-3 py-2 font-black text-white">Use my location</button>
          </div>
        </div>
        {errors.dropOffLocationId && <p id="location-error" className="mt-2 text-sm font-bold text-red-700">{errors.dropOffLocationId}</p>}
      </section>

      <section className="rounded-[2rem] border border-[#ead8c2] bg-[#fffaf3] p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c36d2d]">Make it yours</p>
            <h2 className="mt-2 text-2xl font-black text-[#4c2b1d]">Custom feedback questions</h2>
            <p className="mt-2 text-sm text-[#866b58]">Ask tasters up to three things about your bake.</p>
          </div>
          <span className="rounded-full bg-[#f7e5cd] px-3 py-1 text-xs font-black text-[#81451f]">{values.feedbackQuestions.length}/3 questions</span>
        </div>
        <div className="mt-5 space-y-3">
          {values.feedbackQuestions.map((question, index) => (
            <div key={index} className="flex gap-2">
              <label htmlFor={`question-${index}`} className="sr-only">Feedback question {index + 1}</label>
              <input
                id={`question-${index}`}
                value={question}
                onChange={(event) => updateQuestion(index, event.target.value)}
                placeholder="e.g. Was the sea salt too much?"
                className="min-w-0 flex-1 rounded-2xl border border-[#dfcbb5] bg-[#fffdf9] px-4 py-3 outline-none focus:border-[#d98932] focus:ring-2 focus:ring-[#f2b35b]/40"
              />
              <button type="button" onClick={() => removeQuestion(index)} className="rounded-2xl px-3 font-black text-[#a75c2b] hover:bg-[#f7e5cd]" aria-label={`Remove question ${index + 1}`}>×</button>
            </div>
          ))}
        </div>
        {errors.feedbackQuestions && <p className="mt-2 text-sm font-bold text-red-700">{errors.feedbackQuestions}</p>}
        {values.feedbackQuestions.length < 3 && (
          <button type="button" onClick={addQuestion} className="mt-5 rounded-full border-2 border-[#c36d2d] px-5 py-3 text-sm font-black text-[#a75c2b] transition hover:bg-[#f7e5cd]">
            + Add question
          </button>
        )}
      </section>

      {existingSubmission && <button type="button" onClick={async () => { const supabase = getSupabaseBrowserClient(); const { data } = await supabase.auth.getUser(); if (!data.user) return; const { error } = await supabase.from("submissions").delete().eq("battle_id", battleId).eq("baker_id", data.user.id); if (error) setSubmitError(error.message); else { setExistingSubmission(false); setSubmitted(false); setValues({ cookieName: "", recipe: "", recipeIsSecret: true, allergens: [], dropOffLocationId: "", locationName: "", locationAddress: "", locationLatitude: null, locationLongitude: null, feedbackQuestions: [] }); } }} className="w-full rounded-full border-2 border-red-300 px-6 py-4 text-base font-black text-red-700">Remove my submission</button>}
      <button type="submit" className="w-full rounded-full bg-[#1d668c] px-6 py-4 text-base font-black text-white shadow-[4px_4px_0_#b4d2df] transition hover:-translate-y-0.5">
        {existingSubmission ? "Save changes →" : "Submit cookie for review →"}
      </button>
    </form>
  );
}

export type { SubmissionFormData };
