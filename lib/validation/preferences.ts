import { z } from "zod";

export const emailPreferencesSchema = z.object({
  emailEnabled: z.boolean(),
});
