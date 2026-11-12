import type { Allergen, CustomFeedbackQuestion } from "../types/domain";

export interface TastingCookie {
  assignmentId: string;
  battleId: string;
  tastingLabel: string;
  allergyTags: Allergen[];
  feedbackQuestions: CustomFeedbackQuestion[];
}

/**
 * Replace this function with a server-side Supabase/Firebase query.
 * The response is intentionally a safe tasting-room projection: no bakerId,
 * baker name, recipe, or other identifying submission fields are returned.
 */
export async function getAssignedCookiesForTaster(
  battleId: string,
  tasterId: string,
): Promise<TastingCookie[]> {
  void tasterId;

  if (!battleId) {
    throw new Error("A battle ID is required to load the tasting room.");
  }

  return [
    {
      assignmentId: "assignment-001",
      battleId,
      tastingLabel: "Cookie #001",
      allergyTags: ["GLUTEN", "DAIRY"],
      feedbackQuestions: [
        { id: "question-001", prompt: "Was the sea salt too much?", order: 1 },
        { id: "question-002", prompt: "How would you describe the chew?", order: 2 },
      ],
    },
    {
      assignmentId: "assignment-002",
      battleId,
      tastingLabel: "Cookie #002",
      allergyTags: ["GLUTEN", "EGG"],
      feedbackQuestions: [
        { id: "question-003", prompt: "Did the cinnamon come through?", order: 1 },
      ],
    },
    {
      assignmentId: "assignment-003",
      battleId,
      tastingLabel: "Cookie #003",
      allergyTags: ["GLUTEN", "SOY"],
      feedbackQuestions: [],
    },
  ];
}
