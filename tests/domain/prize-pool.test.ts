import { describe, expect, it } from "vitest";
import { calculatePrizeDistribution, splitTierAmongWinners } from "@/lib/domain/prize-pool";

describe("prize pool math", () => {
  it("applies the 40/35/25 allocation", () => {
    const distribution = calculatePrizeDistribution(100_00);
    expect(distribution).toEqual({
      match5InMinor: 40_00,
      match4InMinor: 35_00,
      match3InMinor: 25_00,
    });
  });

  it("splits winner amount equally using integer division", () => {
    expect(splitTierAmongWinners(100_00, 4)).toBe(25_00);
  });
});
