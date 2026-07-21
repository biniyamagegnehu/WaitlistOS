import { z } from "zod";

// ── Company Profile Schema ─────────────────────────────────────────────────────────────
export const companyProfileSchema = z.object({
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(200, "Company name must not exceed 200 characters"),
  industry: z.enum([
    "SaaS",
    "Artificial Intelligence",
    "FinTech",
    "HealthTech",
    "E-commerce",
    "Education",
    "Developer Tools",
    "Marketing",
    "Other",
  ]),
  companyDescription: z
    .string()
    .min(1, "Company description is required")
    .max(250, "Company description must not exceed 250 characters"),
  country: z
    .string()
    .min(1, "Country is required"),
  teamSize: z.enum([
    "Solo Founder",
    "2–5 Employees",
    "6–20 Employees",
    "21–50 Employees",
    "50+ Employees",
  ]),
  companyLogo: z.string().optional(),
  companyWebsite: z
    .string()
    .url("Invalid website URL")
    .optional()
    .or(z.literal(""))
    .or(z.literal(undefined)),
});

export type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;
