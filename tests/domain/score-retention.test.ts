import { describe, expect, it } from "vitest";
import { retainLatestFiveScores } from "@/lib/domain/scores";

describe("retainLatestFiveScores", () => {
  it("keeps only the newest five scores", () => {
    const base = new Date("2026-01-01T00:00:00.000Z");
    const scores = Array.from({ length: 7 }, (_, i) => ({
      score: i + 1,
      playedAt: new Date(base.getTime() + i * 1000),
    }));

    const retained = retainLatestFiveScores(scores);
    expect(retained).toHaveLength(5);
    expect(retained[0]?.score).toBe(7);
    expect(retained[4]?.score).toBe(3);
  });
});
