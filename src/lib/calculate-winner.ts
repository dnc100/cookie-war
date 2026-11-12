"use server";

import type { Review } from "../types/domain";

export interface ResultsEntry {
  submissionId: string;
  tastingLabel: string;
  bakerName: string;
  cookieName: string;
  reviewCount: number;
  averages: {
    taste: number;
    texture: number;
    appearance: number;
    overall: number;
  };
  feedbackQuestions: Array<{
    prompt: string;
    answers: string[];
  }>;
}

interface ResultsDataSource {
  reviews: Review[];
  submissions: Array<{
    id: string;
    battleId: string;
    blindCode: string;
    bakerName: string;
    cookieName: string;
    feedbackQuestions: Array<{ id: string; prompt: string }>;
  }>;
}

const demoData: ResultsDataSource = {
  reviews: [
    { id: "review-1", assignmentId: "assignment-001", battleId: "cozy-crunch", tasterId: "taster-1", submissionId: "submission-1", scores: { taste: 9, texture: 8, appearance: 9 }, customAnswers: { "question-001": "Just right!", "question-002": "Lovely and chewy." }, submittedAt: "2026-12-12T12:00:00Z" },
    { id: "review-2", assignmentId: "assignment-002", battleId: "cozy-crunch", tasterId: "taster-2", submissionId: "submission-1", scores: { taste: 10, texture: 9, appearance: 8 }, customAnswers: { "question-001": "A perfect little sparkle.", "question-002": "Soft in the middle." }, submittedAt: "2026-12-12T12:05:00Z" },
    { id: "review-3", assignmentId: "assignment-003", battleId: "cozy-crunch", tasterId: "taster-3", submissionId: "submission-2", scores: { taste: 8, texture: 8, appearance: 7 }, customAnswers: { "question-003": "Yes, cinnamon came through beautifully." }, submittedAt: "2026-12-12T12:10:00Z" },
  ],
  submissions: [
    { id: "submission-1", battleId: "cozy-crunch", blindCode: "Cookie #001", bakerName: "Maya Chen", cookieName: "Sea Salt Stardust", feedbackQuestions: [{ id: "question-001", prompt: "Was the sea salt too much?" }, { id: "question-002", prompt: "How would you describe the chew?" }] },
    { id: "submission-2", battleId: "cozy-crunch", blindCode: "Cookie #002", bakerName: "Sam Rivera", cookieName: "Cinnamon Cloud", feedbackQuestions: [{ id: "question-003", prompt: "Did the cinnamon come through?" }] },
  ],
};

function average(total: number, count: number) {
  return Number((total / count).toFixed(2));
}

/**
 * Server-only results calculation. Replace demoData with authenticated,
 * battle-scoped database reads before exposing this action to a client.
 */
export async function calculateWinner(battleId: string): Promise<ResultsEntry[]> {
  if (!battleId) throw new Error("A battle ID is required to calculate results.");

  const submissions = demoData.submissions.filter((submission) => submission.battleId === battleId);
  const reviews = demoData.reviews.filter((review) => review.battleId === battleId);

  const entries = submissions
    .map((submission) => {
      const submissionReviews = reviews.filter((review) => review.submissionId === submission.id);
      if (submissionReviews.length === 0) return null;

      const totals = submissionReviews.reduce(
        (sum, review) => ({
          taste: sum.taste + review.scores.taste,
          texture: sum.texture + review.scores.texture,
          appearance: sum.appearance + review.scores.appearance,
        }),
        { taste: 0, texture: 0, appearance: 0 },
      );
      const averages = {
        taste: average(totals.taste, submissionReviews.length),
        texture: average(totals.texture, submissionReviews.length),
        appearance: average(totals.appearance, submissionReviews.length),
        overall: 0,
      };
      averages.overall = average(averages.taste + averages.texture + averages.appearance, 3);

      return {
        submissionId: submission.id,
        tastingLabel: submission.blindCode,
        bakerName: submission.bakerName,
        cookieName: submission.cookieName,
        reviewCount: submissionReviews.length,
        averages,
        feedbackQuestions: submission.feedbackQuestions.map((question) => ({
          prompt: question.prompt,
          answers: submissionReviews
            .map((review) => review.customAnswers[question.id])
            .filter((answer): answer is string => Boolean(answer?.trim())),
        })),
      };
    })
    .filter((entry): entry is ResultsEntry => entry !== null);

  return entries.sort((left, right) => right.averages.overall - left.averages.overall);
}
