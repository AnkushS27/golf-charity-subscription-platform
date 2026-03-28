import { z } from "zod";

export const scoreEntrySchema = z.object({
  score: z.number().int().min(1).max(45),
  playedAt: z.date(),
});
