import type { Allergen } from "../types/domain";

export interface MatchingBaker {
  id: string;
  name: string;
  cookieName: string;
  allergens: Allergen[];
  locationId: string;
}

export interface MatchingTaster {
  id: string;
  name: string;
  allergens: Allergen[];
  locationId: string;
}

export interface CookieMatch {
  bakerId: string;
  bakerName: string;
  cookieName: string;
  tasterId: string;
  tasterName: string;
  locationId: string;
}

export interface MatchingResult {
  matches: CookieMatch[];
  unassignedBakers: MatchingBaker[];
  unassignedTasters: MatchingTaster[];
}

function hasAllergenConflict(cookieAllergens: Allergen[], tasterAllergens: Allergen[]) {
  const tasterAllergenSet = new Set(tasterAllergens);
  return cookieAllergens.some((allergen) => tasterAllergenSet.has(allergen));
}

/**
 * Assigns each cookie to at most one taster while preferring a shared
 * drop-off/location. Allergen conflicts are a hard exclusion.
 */
export function generateMatching(
  bakers: MatchingBaker[],
  tasters: MatchingTaster[],
): MatchingResult {
  const assignmentsByTaster = new Map<string, number>();
  const matches: CookieMatch[] = [];
  const assignedBakerIds = new Set<string>();
  const assignedTasterIds = new Set<string>();

  for (const baker of bakers) {
    const eligibleTasters = tasters
      .filter((taster) => !hasAllergenConflict(baker.allergens, taster.allergens))
      .sort((left, right) => {
        const leftLoad = assignmentsByTaster.get(left.id) ?? 0;
        const rightLoad = assignmentsByTaster.get(right.id) ?? 0;
        const locationPreference =
          Number(right.locationId === baker.locationId) - Number(left.locationId === baker.locationId);
        return locationPreference || leftLoad - rightLoad || left.id.localeCompare(right.id);
      });

    const taster = eligibleTasters[0];
    if (!taster) continue;

    matches.push({
      bakerId: baker.id,
      bakerName: baker.name,
      cookieName: baker.cookieName,
      tasterId: taster.id,
      tasterName: taster.name,
      locationId: baker.locationId,
    });
    assignedBakerIds.add(baker.id);
    assignedTasterIds.add(taster.id);
    assignmentsByTaster.set(taster.id, (assignmentsByTaster.get(taster.id) ?? 0) + 1);
  }

  return {
    matches,
    unassignedBakers: bakers.filter((baker) => !assignedBakerIds.has(baker.id)),
    unassignedTasters: tasters.filter((taster) => !assignedTasterIds.has(taster.id)),
  };
}
