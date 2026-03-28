import { z } from "zod";

export const createSubscriptionSchema = z.object({
  planCode: z.enum(["monthly", "yearly"]),
  mockPaymentShouldFail: z.boolean().optional().default(false),
  charityPercent: z.number().min(10).max(100),
});
