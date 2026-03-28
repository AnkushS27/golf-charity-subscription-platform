import type { DrawMode } from "@prisma/client";

export function generateRandomDrawNumbers(size = 5, max = 45): number[] {
  const values = new Set<number>();
  while (values.size < size) {
    values.add(Math.floor(Math.random() * max) + 1);
  }
  return [...values].sort((a, b) => a - b);
}

export function generateWeightedDrawNumbers(
  scoreFrequency: Record<number, number>,
  mode: DrawMode,
  size = 5,
): number[] {
  const entries = Object.entries(scoreFrequency)
    .map(([score, frequency]) => ({ score: Number(score), frequency }))
    .filter((entry) => entry.score >= 1 && entry.score <= 45);

  const sorted = entries.sort((a, b) => {
    const delta = a.frequency - b.frequency;
    return mode === "WEIGHTED_MOST_FREQUENT" ? -delta : delta;
  });

  const chosen = sorted.slice(0, size).map((entry) => entry.score);

  if (chosen.length >= size) {
    return chosen.sort((a, b) => a - b);
  }

  const randomFill = generateRandomDrawNumbers(size * 2, 45);
  for (const score of randomFill) {
    if (!chosen.includes(score)) {
      chosen.push(score);
    }
    if (chosen.length === size) {
      break;
    }
  }

  return chosen.sort((a, b) => a - b);
}
