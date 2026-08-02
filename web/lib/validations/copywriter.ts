import { z } from "zod";

const copyFeatureSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

const copyFaqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});

export const copywriterSchema = z.object({
  headline: z.string().min(1, "Headline is required"),
  subheadline: z.string().min(1, "Subheadline is required"),
  cta: z.string().min(1, "CTA text is required"),
  features: z
    .array(copyFeatureSchema)
    .length(3, "Exactly 3 features are required"),
  faqs: z.array(copyFaqSchema).length(5, "Exactly 5 FAQs are required"),
});

export type CopywriterFormData = z.infer<typeof copywriterSchema>;
