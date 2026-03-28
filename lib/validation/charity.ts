import { z } from "zod";

const urlOrEmpty = z
  .string()
  .trim()
  .optional()
  .transform((value) => value ?? "")
  .refine((value) => value.length === 0 || /^https?:\/\//.test(value), "Must be a valid URL")
  .transform((value) => (value.length === 0 ? null : value));

export const createCharitySchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(140),
  description: z.string().min(10).max(1000),
  imageUrl: urlOrEmpty,
  websiteUrl: urlOrEmpty,
  featured: z.boolean(),
  isActive: z.boolean(),
});

export const updateCharitySchema = createCharitySchema.extend({
  charityId: z.string().min(1),
});

export const toggleCharitySchema = z.object({
  charityId: z.string().min(1),
});
