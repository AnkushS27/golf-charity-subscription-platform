export type ScoreRecord = {
  score: number;
  playedAt: Date;
};

/**
 * Maintains the latest five scores in reverse chronological order.
 */
export function retainLatestFiveScores(scores: ScoreRecord[]): ScoreRecord[] {
  return [...scores]
    .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
    .slice(0, 5);
}
