import { z } from "zod";

export const drawModeSchema = z.enum(["RANDOM", "WEIGHTED_MOST_FREQUENT", "WEIGHTED_LEAST_FREQUENT"]);
