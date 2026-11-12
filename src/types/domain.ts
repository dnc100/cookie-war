export type UserRole = "BAKER" | "TASTER" | "ADMIN";

export type Allergen =
  | "GLUTEN"
  | "DAIRY"
  | "EGG"
  | "PEANUT"
  | "TREE_NUT"
  | "SOY"
  | "SESAME";

export type BattleStatus =
  | "DRAFT"
  | "OPEN"
  | "TASTING"
  | "RESULTS"
  | "ARCHIVED";

export type BattlePhase = "SUBMISSIONS" | "TASTE_DAY" | "RESULTS_DAY";

export interface User {
  id: string;
  email: string;
  displayName: string;
  roles: UserRole[];
  avatarUrl?: string;
  createdAt: string;
}

export interface TasterProfile {
  userId: string;
  homeLocation: GeoPoint;
  likes: string[];
  dislikes: string[];
  allergens: Allergen[];
}

export interface GeoPoint {
  label: string;
  latitude?: number;
  longitude?: number;
}

export interface BattleLocation {
  id: string;
  name: string;
  address: string;
  capacity: number;
}

export interface Battle {
  id: string;
  name: string;
  theme?: string;
  status: BattleStatus;
  dates: {
    submissionsCloseAt: string;
    tasteDayAt: string;
    resultsDayAt: string;
  };
  locations: BattleLocation[];
  prize?: {
    title: string;
    description: string;
  };
  createdBy: string;
  createdAt: string;
}

export interface BattleParticipant {
  battleId: string;
  userId: string;
  role: "BAKER" | "TASTER";
  locationId?: string;
  joinedAt: string;
}

export interface CustomFeedbackQuestion {
  id: string;
  prompt: string;
  order: number;
}

export interface Submission {
  id: string;
  battleId: string;
  bakerId: string;
  cookieName: string;
  recipe?: string;
  recipeIsSecret: boolean;
  allergyTags: Allergen[];
  imageUrls: string[];
  feedbackQuestions: CustomFeedbackQuestion[];
  dropOffLocationId: string;
  /** Public to the tasting room; never expose bakerId before Results Day. */
  blindCode: string;
  createdAt: string;
}

export interface BattleAssignment {
  id: string;
  battleId: string;
  submissionId: string;
  tasterId: string;
  /** The taster-facing identifier, e.g. "Cookie #004". */
  tastingLabel: string;
  matchedAt: string;
}

export interface Review {
  id: string;
  assignmentId: string;
  battleId: string;
  tasterId: string;
  submissionId: string;
  scores: {
    taste: number;
    texture: number;
    appearance: number;
  };
  customAnswers: Record<string, string>;
  notes?: string;
  submittedAt: string;
}
