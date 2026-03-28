import { z } from "zod";

export const reviewWinnerSchema = z.object({
  verificationId: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNotes: z.string().max(1000).optional(),
});
