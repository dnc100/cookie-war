"use client";

import { useState, type FormEvent } from "react";
import type { CustomFeedbackQuestion } from "../types/domain";
import type { TastingCookie } from "../lib/tasting-room-repository";

type Scores = {
  taste: number;
  texture: number;
  appearance: number;
};

type ReviewValues = Scores & {
  customAnswers: Record<string, string>;
};

const scoreLabels: Array<{ key: keyof Scores; label: string; hint: string }> = [
  { key: "taste", label: "Taste", hint: "How delicious is it?" },
  { key: "texture", label: "Texture", hint: "How does it feel?" },
  { key: "appearance", label: "Appearance", hint: "How does it look?" },
];

export function ReviewCard({
  cookie,
  onSubmit,
}: {
  cookie: TastingCookie;
  onSubmit?: (review: ReviewValues) => void;
}) {
  const [values, setValues] = useState<ReviewValues>({
    taste: 5,
    texture: 5,
    appearance: 5,
    customAnswers: {},
  });
  const [saved, setSaved] = useState(false);

  const setScore = (key: keyof Scores, score: number) => {
    setValues((current) => ({ ...current, [key]: score }));
    setSaved(false);
  };

  const setAnswer = (question: CustomFeedbackQuestion, answer: string) => {
    setValues((current) => ({
      ...current,
      customAnswers: { ...current.customAnswers, [question.id]: answer },
    }));
    setSaved(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.(values);
    setSaved(true);
  };

  return (
    <article className="overflow-hidden rounded-[2rem] border border-[#ead8c2] bg-[#fffaf3] shadow-[0_8px_24px_rgba(115,72,37,0.07)]">
      <div className="flex items-center justify-between bg-[#81451f] px-5 py-5 text-[#fffaf3] sm:px-7">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f5b95a]">Anonymous entry</p>
          <h2 className="mt-1 text-3xl font-black tracking-[-0.05em]">{cookie.tastingLabel}</h2>
        </div>
        <span className="text-3xl" aria-hidden="true">🍪</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7 p-5 sm:p-7">
        <fieldset>
          <legend className="text-lg font-black text-[#4c2b1d]">Give it a score</legend>
          <p className="mt-1 text-sm text-[#866b58]">Slide from 1 (not for me) to 10 (would absolutely eat again).</p>
          <div className="mt-5 space-y-6">
            {scoreLabels.map((score) => (
              <div key={score.key}>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <label htmlFor={`${cookie.assignmentId}-${score.key}`} className="font-black text-[#63351e]">{score.label}</label>
                    <p className="mt-0.5 text-xs text-[#866b58]">{score.hint}</p>
                  </div>
                  <output htmlFor={`${cookie.assignmentId}-${score.key}`} className="text-2xl font-black text-[#c36d2d]">{values[score.key]}<span className="text-sm text-[#866b58]">/10</span></output>
                </div>
                <input
                  id={`${cookie.assignmentId}-${score.key}`}
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={values[score.key]}
                  onChange={(event) => setScore(score.key, Number(event.target.value))}
                  className="mt-3 h-3 w-full cursor-pointer accent-[#c36d2d]"
                  aria-label={`${score.label} score from 1 to 10`}
                />
                <div className="mt-1 flex justify-between text-[11px] font-bold text-[#a88b73]"><span>1</span><span>10</span></div>
              </div>
            ))}
          </div>
        </fieldset>

        {cookie.feedbackQuestions.length > 0 && (
          <fieldset className="border-t border-[#ead8c2] pt-6">
            <legend className="text-lg font-black text-[#4c2b1d]">A few more thoughts</legend>
            <div className="mt-4 space-y-5">
              {cookie.feedbackQuestions.map((question) => (
                <div key={question.id}>
                  <label htmlFor={`${cookie.assignmentId}-${question.id}`} className="text-sm font-black text-[#63351e]">{question.prompt}</label>
                  <textarea
                    id={`${cookie.assignmentId}-${question.id}`}
                    value={values.customAnswers[question.id] ?? ""}
                    onChange={(event) => setAnswer(question, event.target.value)}
                    rows={3}
                    placeholder="Share a kind, honest thought..."
                    className="mt-2 w-full resize-y rounded-2xl border border-[#dfcbb5] bg-[#fffdf9] px-4 py-3 text-sm outline-none focus:border-[#d98932] focus:ring-2 focus:ring-[#f2b35b]/40"
                  />
                </div>
              ))}
            </div>
          </fieldset>
        )}

        <button type="submit" className="min-h-12 w-full rounded-full bg-[#d8ff88] px-5 py-3 font-black text-[#49391c] transition active:scale-[0.98]">
          {saved ? "Review saved ✓" : "Save review"}
        </button>
      </form>
    </article>
  );
}
