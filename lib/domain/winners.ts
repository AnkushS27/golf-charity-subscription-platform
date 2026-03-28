import type { WinnerTier } from "@prisma/client";

export function countMatches(playerNumbers: number[], drawNumbers: number[]): number {
  const drawSet = new Set(drawNumbers);
  return playerNumbers.filter((value) => drawSet.has(value)).length;
}

export function getWinnerTier(matchCount: number): WinnerTier | null {
  if (matchCount >= 5) {
    return "MATCH_5";
  }
  if (matchCount === 4) {
    return "MATCH_4";
  }
  if (matchCount === 3) {
    return "MATCH_3";
  }
  return null;
}
