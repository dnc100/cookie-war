import type { MatchingBaker, MatchingTaster } from "./generate-matching";

export interface BattleLogistics {
  bakers: MatchingBaker[];
  tasters: MatchingTaster[];
}

export async function getBattleLogistics(battleId: string): Promise<BattleLogistics> {
  if (!battleId) {
    throw new Error("A battle ID is required to load logistics.");
  }

  // Replace with an authenticated server-side query scoped to battleId.
  return {
    bakers: [
      { id: "baker-1", name: "Maya Chen", cookieName: "Sea Salt Stardust", allergens: ["GLUTEN", "DAIRY"], locationId: "maple-street" },
      { id: "baker-2", name: "Sam Rivera", cookieName: "Cinnamon Cloud", allergens: ["GLUTEN", "EGG"], locationId: "sunrise-cafe" },
      { id: "baker-3", name: "Priya Shah", cookieName: "The Nutty Neighbor", allergens: ["GLUTEN", "PEANUT"], locationId: "maple-street" },
    ],
    tasters: [
      { id: "taster-1", name: "Jordan Lee", allergens: ["PEANUT", "TREE_NUT"], locationId: "maple-street" },
      { id: "taster-2", name: "Casey Morgan", allergens: ["DAIRY"], locationId: "sunrise-cafe" },
      { id: "taster-3", name: "Riley Kim", allergens: [], locationId: "maple-street" },
    ],
  };
}
