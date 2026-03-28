export type PrizeDistribution = {
  match5InMinor: number;
  match4InMinor: number;
  match3InMinor: number;
};

export function calculatePrizeDistribution(totalPoolInMinor: number): PrizeDistribution {
  return {
    match5InMinor: Math.floor(totalPoolInMinor * 0.4),
    match4InMinor: Math.floor(totalPoolInMinor * 0.35),
    match3InMinor: Math.floor(totalPoolInMinor * 0.25),
  };
}

export function splitTierAmongWinners(tierAmountInMinor: number, winnerCount: number): number {
  if (winnerCount <= 0) {
    return 0;
  }
  return Math.floor(tierAmountInMinor / winnerCount);
}
