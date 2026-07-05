import { z } from "zod";

const ALLOWED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;

export const createWaitlistSchema = z.object({
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(120, "Product name must be at most 120 characters"),
  tagline: z
    .string()
    .min(2, "Tagline must be at least 2 characters")
    .max(200, "Tagline must be at most 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .optional(),
});

export type CreateWaitlistFormData = z.infer<typeof createWaitlistSchema>;

export function validateLogoFile(file: File | null): string | null {
  if (!file) {
    return "Logo is required";
  }

  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return "Logo must be PNG, JPEG, JPG, or WEBP";
  }

  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return "Logo must be 5MB or smaller";
  }

  return null;
}
