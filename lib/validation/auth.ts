import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});
