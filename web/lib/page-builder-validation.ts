/**
 * Page Builder Validation
 *
 * Single source of truth for all field limits used in the Visual Page Builder.
 * The backend mirrors these exact limits in page-config.ts.
 */

import type { PageConfig, PageSection, PageSectionType } from "@/types/page-builder";

// ─── Limits (mirrored in api/src/modules/waitlists/page-config.ts) ───────────

export const LIMITS = {
  HERO: { headline: { max: 100 }, subheadline: { max: 160 }, description: { max: 300 } },
  FEATURES: {
    title: { max: 100 },
    items: { min: 1, max: 6 },
    itemTitle: { max: 60 },
    itemDescription: { max: 250 },
  },
  FAQ: {
    title: { max: 100 },
    items: { min: 1, max: 20 },
    question: { max: 150 },
    answer: { max: 1000 },
  },
  SIGNUP: { title: { max: 100 }, subtitle: { max: 200 } },
  SOCIAL_PROOF: { title: { max: 100 }, description: { max: 300 } },
  FOOTER: { title: { max: 100 }, text: { max: 500 } },
} as const;

// ─── Error type ───────────────────────────────────────────────────────────────

/** Keyed by "sectionId.fieldKey" e.g. "hero.headline" or "features.items[2].title" */
export type FieldErrors = Record<string, string>;

/** Per-section validation result: sectionId → list of human-readable error messages */
export type SectionErrors = Record<string, string[]>;

export interface ValidationResult {
  valid: boolean;
  /** Field-level errors (for inline display next to inputs) */
  fieldErrors: FieldErrors;
  /** Section-level grouped errors (for the summary banner) */
  sectionErrors: SectionErrors;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeQuestion(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseItems(raw: unknown): Array<Record<string, string>> {
  if (Array.isArray(raw)) return raw as Array<Record<string, string>>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// ─── Per-section validators ───────────────────────────────────────────────────

function validateHero(id: string, content: Record<string, unknown>): { fields: FieldErrors; messages: string[] } {
  const fields: FieldErrors = {};
  const messages: string[] = [];

  const headline = trim(content.headline);
  if (!headline) {
    fields[`${id}.headline`] = "Headline is required.";
    messages.push("Headline is required.");
  } else if (headline.length > LIMITS.HERO.headline.max) {
    fields[`${id}.headline`] = `Headline must be ${LIMITS.HERO.headline.max} characters or less.`;
    messages.push(`Headline must be ${LIMITS.HERO.headline.max} characters or less.`);
  }

  const subheadline = trim(content.subheadline);
  if (subheadline && subheadline.length > LIMITS.HERO.subheadline.max) {
    fields[`${id}.subheadline`] = `Subheadline must be ${LIMITS.HERO.subheadline.max} characters or less.`;
    messages.push(`Subheadline must be ${LIMITS.HERO.subheadline.max} characters or less.`);
  }

  const description = trim(content.description);
  if (description && description.length > LIMITS.HERO.description.max) {
    fields[`${id}.description`] = `Description must be ${LIMITS.HERO.description.max} characters or less.`;
    messages.push(`Description must be ${LIMITS.HERO.description.max} characters or less.`);
  }

  return { fields, messages };
}

function validateFeatures(id: string, content: Record<string, unknown>): { fields: FieldErrors; messages: string[] } {
  const fields: FieldErrors = {};
  const messages: string[] = [];

  const title = trim(content.title);
  if (!title) {
    fields[`${id}.title`] = "Features title is required.";
    messages.push("Features title is required.");
  } else if (title.length > LIMITS.FEATURES.title.max) {
    fields[`${id}.title`] = `Features title must be ${LIMITS.FEATURES.title.max} characters or less.`;
    messages.push(`Features title must be ${LIMITS.FEATURES.title.max} characters or less.`);
  }

  const items = parseItems(content.items);
  if (items.length < LIMITS.FEATURES.items.min) {
    fields[`${id}.items`] = `You must have at least ${LIMITS.FEATURES.items.min} feature.`;
    messages.push(`You must have at least ${LIMITS.FEATURES.items.min} feature.`);
  } else if (items.length > LIMITS.FEATURES.items.max) {
    fields[`${id}.items`] = `You can have a maximum of ${LIMITS.FEATURES.items.max} features.`;
    messages.push(`You can have a maximum of ${LIMITS.FEATURES.items.max} features.`);
  }

  items.forEach((item, index) => {
    const itemTitle = trim(item.title);
    if (!itemTitle) {
      fields[`${id}.items[${index}].title`] = "Feature title is required.";
      messages.push(`Feature ${index + 1} title is required.`);
    } else if (itemTitle.length > LIMITS.FEATURES.itemTitle.max) {
      fields[`${id}.items[${index}].title`] = `Feature title must be ${LIMITS.FEATURES.itemTitle.max} characters or less.`;
      messages.push(`Feature ${index + 1} title must be ${LIMITS.FEATURES.itemTitle.max} characters or less.`);
    }

    const itemDesc = trim(item.description);
    if (!itemDesc) {
      fields[`${id}.items[${index}].description`] = "Feature description is required.";
      messages.push(`Feature ${index + 1} description is required.`);
    } else if (itemDesc.length > LIMITS.FEATURES.itemDescription.max) {
      fields[`${id}.items[${index}].description`] = `Feature description must be ${LIMITS.FEATURES.itemDescription.max} characters or less.`;
      messages.push(`Feature ${index + 1} description must be ${LIMITS.FEATURES.itemDescription.max} characters or less.`);
    }
  });

  return { fields, messages };
}

function validateFaq(id: string, content: Record<string, unknown>): { fields: FieldErrors; messages: string[] } {
  const fields: FieldErrors = {};
  const messages: string[] = [];

  const title = trim(content.title);
  if (!title) {
    fields[`${id}.title`] = "FAQ title is required.";
    messages.push("FAQ title is required.");
  } else if (title.length > LIMITS.FAQ.title.max) {
    fields[`${id}.title`] = `FAQ title must be ${LIMITS.FAQ.title.max} characters or less.`;
    messages.push(`FAQ title must be ${LIMITS.FAQ.title.max} characters or less.`);
  }

  const items = parseItems(content.items);
  if (items.length < LIMITS.FAQ.items.min) {
    fields[`${id}.items`] = `You must have at least ${LIMITS.FAQ.items.min} FAQ.`;
    messages.push(`You must have at least ${LIMITS.FAQ.items.min} FAQ.`);
  } else if (items.length > LIMITS.FAQ.items.max) {
    fields[`${id}.items`] = `You can have a maximum of ${LIMITS.FAQ.items.max} FAQs.`;
    messages.push(`You can have a maximum of ${LIMITS.FAQ.items.max} FAQs.`);
  }

  const seenQuestions = new Map<string, number>();

  items.forEach((item, index) => {
    const question = trim(item.question);
    if (!question) {
      fields[`${id}.items[${index}].question`] = "FAQ question is required.";
      messages.push(`FAQ ${index + 1} question is required.`);
    } else if (question.length > LIMITS.FAQ.question.max) {
      fields[`${id}.items[${index}].question`] = `FAQ question must be ${LIMITS.FAQ.question.max} characters or less.`;
      messages.push(`FAQ ${index + 1} question must be ${LIMITS.FAQ.question.max} characters or less.`);
    } else {
      const normalized = normalizeQuestion(question);
      if (seenQuestions.has(normalized)) {
        fields[`${id}.items[${index}].question`] = "This FAQ question already exists.";
        messages.push(`FAQ ${index + 1}: This question already exists (duplicate of FAQ ${(seenQuestions.get(normalized) ?? 0) + 1}).`);
      } else {
        seenQuestions.set(normalized, index);
      }
    }

    const answer = trim(item.answer);
    if (!answer) {
      fields[`${id}.items[${index}].answer`] = "FAQ answer is required.";
      messages.push(`FAQ ${index + 1} answer is required.`);
    } else if (answer.length > LIMITS.FAQ.answer.max) {
      fields[`${id}.items[${index}].answer`] = `FAQ answer must be ${LIMITS.FAQ.answer.max} characters or less.`;
      messages.push(`FAQ ${index + 1} answer must be ${LIMITS.FAQ.answer.max} characters or less.`);
    }
  });

  return { fields, messages };
}

function validateSignup(id: string, content: Record<string, unknown>): { fields: FieldErrors; messages: string[] } {
  const fields: FieldErrors = {};
  const messages: string[] = [];

  const title = trim(content.title);
  if (!title) {
    fields[`${id}.title`] = "Form title is required.";
    messages.push("Form title is required.");
  } else if (title.length > LIMITS.SIGNUP.title.max) {
    fields[`${id}.title`] = `Form title must be ${LIMITS.SIGNUP.title.max} characters or less.`;
    messages.push(`Form title must be ${LIMITS.SIGNUP.title.max} characters or less.`);
  }

  const subtitle = trim(content.subtitle);
  if (subtitle && subtitle.length > LIMITS.SIGNUP.subtitle.max) {
    fields[`${id}.subtitle`] = `Form subtitle must be ${LIMITS.SIGNUP.subtitle.max} characters or less.`;
    messages.push(`Form subtitle must be ${LIMITS.SIGNUP.subtitle.max} characters or less.`);
  }

  return { fields, messages };
}

function validateSocialProof(id: string, content: Record<string, unknown>): { fields: FieldErrors; messages: string[] } {
  const fields: FieldErrors = {};
  const messages: string[] = [];

  const title = trim(content.title);
  if (!title) {
    fields[`${id}.title`] = "Social proof title is required.";
    messages.push("Social proof title is required.");
  } else if (title.length > LIMITS.SOCIAL_PROOF.title.max) {
    fields[`${id}.title`] = `Social proof title must be ${LIMITS.SOCIAL_PROOF.title.max} characters or less.`;
    messages.push(`Social proof title must be ${LIMITS.SOCIAL_PROOF.title.max} characters or less.`);
  }

  const description = trim(content.description);
  if (description && description.length > LIMITS.SOCIAL_PROOF.description.max) {
    fields[`${id}.description`] = `Social proof description must be ${LIMITS.SOCIAL_PROOF.description.max} characters or less.`;
    messages.push(`Social proof description must be ${LIMITS.SOCIAL_PROOF.description.max} characters or less.`);
  }

  const screenshotUrl = trim(content.screenshotUrl);
  if (!screenshotUrl) {
    fields[`${id}.screenshotUrl`] = "Social proof screenshot is required.";
    messages.push("Social proof screenshot is required.");
  }

  return { fields, messages };
}

function validateFooter(id: string, content: Record<string, unknown>): { fields: FieldErrors; messages: string[] } {
  const fields: FieldErrors = {};
  const messages: string[] = [];

  const title = trim(content.title);
  if (!title) {
    fields[`${id}.title`] = "Footer title is required.";
    messages.push("Footer title is required.");
  } else if (title.length > LIMITS.FOOTER.title.max) {
    fields[`${id}.title`] = `Footer title must be ${LIMITS.FOOTER.title.max} characters or less.`;
    messages.push(`Footer title must be ${LIMITS.FOOTER.title.max} characters or less.`);
  }

  const text = trim(content.text);
  if (!text) {
    fields[`${id}.text`] = "Footer text is required.";
    messages.push("Footer text is required.");
  } else if (text.length > LIMITS.FOOTER.text.max) {
    fields[`${id}.text`] = `Footer text must be ${LIMITS.FOOTER.text.max} characters or less.`;
    messages.push(`Footer text must be ${LIMITS.FOOTER.text.max} characters or less.`);
  }

  return { fields, messages };
}

// ─── Main validator ───────────────────────────────────────────────────────────

const sectionValidators: Partial<Record<PageSectionType, (id: string, content: Record<string, unknown>) => { fields: FieldErrors; messages: string[] }>> = {
  HERO: validateHero,
  FEATURES: validateFeatures,
  FAQ: validateFaq,
  SIGNUP: validateSignup,
  SOCIAL_PROOF: validateSocialProof,
  FOOTER: validateFooter,
};

export function validatePageConfig(config: PageConfig): ValidationResult {
  const allFieldErrors: FieldErrors = {};
  const allSectionErrors: SectionErrors = {};

  for (const section of config.sections) {
    const validator = sectionValidators[section.type];
    if (!validator) continue;

    const content = section.content as Record<string, unknown>;
    const { fields, messages } = validator(section.id, content);

    Object.assign(allFieldErrors, fields);
    if (messages.length > 0) {
      allSectionErrors[section.id] = messages;
    }
  }

  return {
    valid: Object.keys(allFieldErrors).length === 0,
    fieldErrors: allFieldErrors,
    sectionErrors: allSectionErrors,
  };
}

/** Returns the field error for a specific section+field combination. */
export function getFieldError(fieldErrors: FieldErrors, sectionId: string, fieldKey: string): string | undefined {
  return fieldErrors[`${sectionId}.${fieldKey}`];
}

/** Returns the field error for an item field (e.g. features or FAQ items). */
export function getItemFieldError(fieldErrors: FieldErrors, sectionId: string, index: number, fieldKey: string): string | undefined {
  return fieldErrors[`${sectionId}.items[${index}].${fieldKey}`];
}

/** Returns the total count of all validation errors across all sections. */
export function countErrors(result: ValidationResult): number {
  return Object.keys(result.fieldErrors).length;
}
