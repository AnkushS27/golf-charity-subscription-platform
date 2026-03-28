import { describe, expect, it } from "vitest";
import { countMatches, getWinnerTier } from "@/lib/domain/winners";

describe("winner tiering", () => {
  it("counts matches accurately", () => {
    expect(countMatches([5, 10, 15, 20, 25], [1, 10, 15, 20, 45])).toBe(3);
  });

  it("maps match count to winner tiers", () => {
    expect(getWinnerTier(5)).toBe("MATCH_5");
    expect(getWinnerTier(4)).toBe("MATCH_4");
    expect(getWinnerTier(3)).toBe("MATCH_3");
    expect(getWinnerTier(2)).toBeNull();
  });
});
