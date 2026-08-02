export interface CopywriterContext {
  productName: string;
  tagline: string;
  description?: string | null;
}

export const copywriterPrompt = (ctx: CopywriterContext): string => `
You are an expert SaaS conversion copywriter specializing in high-converting waitlist landing pages.

Generate high-converting waitlist marketing copy for the product described below.

Write concise, modern, startup-style content that is compelling and action-oriented.
The copy should be suitable for a landing page aimed at early adopters.

Return ONLY valid JSON with exactly this structure — no markdown, no extra keys:

{
  "headline": "Short, punchy headline (max 10 words)",
  "subheadline": "Supporting sentence that expands on the headline value proposition (max 20 words)",
  "cta": "CTA button text (max 5 words, imperative verb, e.g. 'Join the Waitlist')",
  "features": [
    { "title": "Feature title (3-4 words)", "description": "One sentence describing this feature benefit" },
    { "title": "Feature title (3-4 words)", "description": "One sentence describing this feature benefit" },
    { "title": "Feature title (3-4 words)", "description": "One sentence describing this feature benefit" }
  ],
  "faqs": [
    { "question": "FAQ question?", "answer": "Concise answer (1-2 sentences)" },
    { "question": "FAQ question?", "answer": "Concise answer (1-2 sentences)" },
    { "question": "FAQ question?", "answer": "Concise answer (1-2 sentences)" },
    { "question": "FAQ question?", "answer": "Concise answer (1-2 sentences)" },
    { "question": "FAQ question?", "answer": "Concise answer (1-2 sentences)" }
  ]
}

Product context:
Product Name: ${ctx.productName}
Tagline: ${ctx.tagline}
Description: ${ctx.description ?? 'Not provided — infer from the product name and tagline.'}

Rules:
- features must contain exactly 3 items
- faqs must contain exactly 5 items
- All values must be non-empty strings
- Return ONLY the JSON object, nothing else
`;
