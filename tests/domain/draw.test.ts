import { describe, expect, it } from "vitest";
import { generateWeightedDrawNumbers } from "@/lib/domain/draw";

describe("draw generation", () => {
  it("returns fixed-size weighted set even with sparse frequency input", () => {
    const values = generateWeightedDrawNumbers({ 5: 3, 10: 1 }, "WEIGHTED_MOST_FREQUENT", 5);
    expect(values).toHaveLength(5);
    expect(new Set(values).size).toBe(5);
  });
});
