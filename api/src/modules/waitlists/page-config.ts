import { BadRequestException } from '@nestjs/common';

export const PAGE_SECTION_TYPES = ['HERO', 'FEATURES', 'FAQ', 'SIGNUP', 'SOCIAL_PROOF', 'FOOTER'] as const;
export type PageSectionType = (typeof PAGE_SECTION_TYPES)[number];
export interface PageSection { id: string; type: PageSectionType; order: number; visible: boolean; content: Record<string, unknown>; layout?: Record<string, unknown>; style?: Record<string, unknown>; responsive?: Record<string, unknown>; }
export interface PageConfig { version: 1; mode?: 'CUSTOMIZE_ORIGINAL' | 'FROM_SCRATCH'; theme?: Record<string, unknown>; sections: PageSection[]; }

// ─── Limits (mirrored in web/lib/page-builder-validation.ts) ─────────────────
const LIMITS = {
  HERO: { headline: 100, subheadline: 160, description: 300 },
  FEATURES: { title: 100, items: { min: 1, max: 6 }, itemTitle: 60, itemDescription: 250 },
  FAQ: { title: 100, items: { min: 1, max: 20 }, question: 150, answer: 1000 },
  SIGNUP: { title: 100, subtitle: 200 },
  SOCIAL_PROOF: { title: 100, description: 300 },
  FOOTER: { title: 100, text: 500 },
} as const;

export function defaultPageConfig(mode: "CUSTOMIZE_ORIGINAL" | "FROM_SCRATCH" = "CUSTOMIZE_ORIGINAL"): PageConfig {
  return { version: 1, mode, theme: { primaryColor: '', background: '', text: '', mutedText: '', containerWidth: 'large', sectionSpacing: 'medium', buttonStyle: 'solid', buttonSize: 'medium', buttonRadius: 'rounded', headingFont: 'inherit', bodyFont: 'inherit' }, sections: mode === "FROM_SCRATCH" ? [] : [
    { id: 'hero', type: 'HERO', order: 0, visible: true, content: {} },
    { id: 'social-proof', type: 'SOCIAL_PROOF', order: 1, visible: true, content: {} },
    { id: 'features', type: 'FEATURES', order: 2, visible: true, content: {} },
    { id: 'signup', type: 'SIGNUP', order: 3, visible: true, content: {} },
    { id: 'faq', type: 'FAQ', order: 4, visible: true, content: {} },
    { id: 'footer', type: 'FOOTER', order: 5, visible: true, content: {} },
  ] };
}

export function createConfigFromOriginal(waitlist: any, copy: any): PageConfig {
  const config = defaultPageConfig("CUSTOMIZE_ORIGINAL");
  
  // Hero
  const hero = config.sections.find(s => s.type === 'HERO');
  if (hero) {
    hero.content.headline = copy?.headline || waitlist.name || '';
    hero.content.subheadline = copy?.subheadline || waitlist.tagline || '';
    hero.content.description = waitlist.description || '';
  }

  // Social Proof (optional/default)
  const socialProof = config.sections.find(s => s.type === 'SOCIAL_PROOF');
  if (socialProof) {
    socialProof.content.title = 'Loved by early adopters';
  }

  // Features
  const features = config.sections.find(s => s.type === 'FEATURES');
  if (features && copy?.features && Array.isArray(copy.features)) {
    features.content.title = 'Why join?';
    features.content.items = JSON.stringify(copy.features);
  }

  // Signup
  const signup = config.sections.find(s => s.type === 'SIGNUP');
  if (signup) {
    signup.content.title = 'Join the waitlist';
  }

  // FAQ
  const faq = config.sections.find(s => s.type === 'FAQ');
  if (faq && copy?.faqs && Array.isArray(copy.faqs)) {
    faq.content.title = 'Frequently Asked Questions';
    faq.content.items = JSON.stringify(copy.faqs);
  }

  // Footer
  const footer = config.sections.find(s => s.type === 'FOOTER');
  if (footer) {
    footer.content.title = waitlist.name || '';
    footer.content.text = `© ${new Date().getFullYear()} ${waitlist.name || 'Getlist'}. All rights reserved.`;
  }

  return config;
}

/** Keeps supported sections from earlier builder drafts and restores required defaults. */
export function upgradePageConfig(input: unknown): PageConfig {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return defaultPageConfig();
  const raw = input as { sections?: unknown; theme?: unknown };
  if (!Array.isArray(raw.sections)) return defaultPageConfig();
  const supported = raw.sections.filter((section): section is Record<string, unknown> => !!section && typeof section === 'object' && !Array.isArray(section) && PAGE_SECTION_TYPES.includes((section as Record<string, unknown>).type as PageSectionType));
  const defaults = defaultPageConfig();
  const sections = supported.map((section, order) => ({ id: typeof section.id === 'string' ? section.id : `section-${order}`, type: section.type as PageSectionType, order, visible: section.visible !== false, content: section.content && typeof section.content === 'object' && !Array.isArray(section.content) ? section.content as Record<string, unknown> : {} }));
  for (const fallback of defaults.sections) if (!sections.some((section) => section.type === fallback.type)) sections.push({ ...fallback, order: sections.length });
  return { version: 1, ...(raw.theme && typeof raw.theme === 'object' && !Array.isArray(raw.theme) ? { theme: raw.theme as Record<string, unknown> } : {}), sections };
}

export function validatePageConfig(input: unknown): PageConfig {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BadRequestException('Invalid page configuration');
  const config = input as { version?: unknown; theme?: unknown; sections?: unknown };
  if (config.version !== 1 || !Array.isArray(config.sections) || config.sections.length > 6) throw new BadRequestException('Invalid page configuration');
  validateOptions(config.theme, 'Theme');
  const singleton = new Set<PageSectionType>();
  const sections = config.sections.map((section, index) => {
    if (!section || typeof section !== 'object' || Array.isArray(section)) throw new BadRequestException(`Section ${index + 1} is invalid`);
    const value = section as Record<string, unknown>;
    if (typeof value.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(value.id) || !PAGE_SECTION_TYPES.includes(value.type as PageSectionType) || typeof value.visible !== 'boolean' || !value.content || typeof value.content !== 'object' || Array.isArray(value.content)) throw new BadRequestException(`Section ${index + 1} is invalid`);
    const type = value.type as PageSectionType;
    if (['HERO', 'SIGNUP', 'FOOTER'].includes(type) && singleton.has(type)) throw new BadRequestException(`${type} can only be used once`);
    singleton.add(type);
    validateSectionContent(type, value.content as Record<string, unknown>);
    validateOptions(value.layout, `${type}.layout`); validateOptions(value.style, `${type}.style`); validateOptions(value.responsive, `${type}.responsive`);
    return { id: value.id, type, order: index, visible: value.visible, content: value.content as Record<string, unknown>, ...(value.layout ? { layout: value.layout as Record<string, unknown> } : {}), ...(value.style ? { style: value.style as Record<string, unknown> } : {}), ...(value.responsive ? { responsive: value.responsive as Record<string, unknown> } : {}) };
  });
  if (!sections.some((section) => section.type === 'SIGNUP')) throw new BadRequestException('A Signup section is required');
  return { version: 1, ...(config.theme ? { theme: config.theme as Record<string, unknown> } : {}), sections };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateOptions(value: unknown, label: string) {
  if (value === undefined) return;
  if (!value || typeof value !== 'object' || Array.isArray(value) || JSON.stringify(value).length > 4_000) throw new BadRequestException(`${label} is invalid`);
  const serialized = JSON.stringify(value);
  if (/<\s*script|javascript:|expression\s*\(/i.test(serialized)) throw new BadRequestException(`${label} contains unsupported values`);
}

function assertNoXss(value: string, label: string): void {
  if (/<\s*script|javascript:/i.test(value)) throw new BadRequestException(`${label} contains unsupported content`);
}

function requireString(value: unknown, fieldLabel: string): string {
  if (typeof value !== 'string') throw new BadRequestException(`${fieldLabel} must be a string`);
  return value;
}

function trimStr(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseItems(raw: unknown, label: string): Array<Record<string, unknown>> {
  if (Array.isArray(raw)) return raw as Array<Record<string, unknown>>;
  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Array<Record<string, unknown>>;
    } catch {
      throw new BadRequestException(`${label} items is not valid JSON`);
    }
  }
  throw new BadRequestException(`${label} items must be an array`);
}

function normalizeQuestion(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ─── Per-section content validators ──────────────────────────────────────────

function validateHeroContent(content: Record<string, unknown>): void {
  const headline = trimStr(content.headline);
  if (!headline) throw new BadRequestException('Headline is required.');
  if (headline.length > LIMITS.HERO.headline) throw new BadRequestException(`Headline must be ${LIMITS.HERO.headline} characters or less.`);
  assertNoXss(headline, 'Headline');

  const subheadline = trimStr(content.subheadline);
  if (subheadline) {
    if (subheadline.length > LIMITS.HERO.subheadline) throw new BadRequestException(`Subheadline must be ${LIMITS.HERO.subheadline} characters or less.`);
    assertNoXss(subheadline, 'Subheadline');
  }

  const description = trimStr(content.description);
  if (description) {
    if (description.length > LIMITS.HERO.description) throw new BadRequestException(`Description must be ${LIMITS.HERO.description} characters or less.`);
    assertNoXss(description, 'Description');
  }
}

function validateFeaturesContent(content: Record<string, unknown>): void {
  const title = trimStr(content.title);
  if (!title) throw new BadRequestException('Features title is required.');
  if (title.length > LIMITS.FEATURES.title) throw new BadRequestException(`Features title must be ${LIMITS.FEATURES.title} characters or less.`);
  assertNoXss(title, 'Features title');

  const items = parseItems(content.items, 'Features');
  if (items.length < LIMITS.FEATURES.items.min) throw new BadRequestException(`You must have at least ${LIMITS.FEATURES.items.min} feature.`);
  if (items.length > LIMITS.FEATURES.items.max) throw new BadRequestException(`You can have a maximum of ${LIMITS.FEATURES.items.max} features.`);

  items.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new BadRequestException(`Feature ${index + 1} is invalid`);
    const itemTitle = trimStr(item.title);
    if (!itemTitle) throw new BadRequestException(`Feature ${index + 1} title is required.`);
    if (itemTitle.length > LIMITS.FEATURES.itemTitle) throw new BadRequestException(`Feature ${index + 1} title must be ${LIMITS.FEATURES.itemTitle} characters or less.`);
    assertNoXss(itemTitle, `Feature ${index + 1} title`);

    const itemDesc = trimStr(item.description);
    if (!itemDesc) throw new BadRequestException(`Feature ${index + 1} description is required.`);
    if (itemDesc.length > LIMITS.FEATURES.itemDescription) throw new BadRequestException(`Feature ${index + 1} description must be ${LIMITS.FEATURES.itemDescription} characters or less.`);
    assertNoXss(itemDesc, `Feature ${index + 1} description`);
  });
}

function validateFaqContent(content: Record<string, unknown>): void {
  const title = trimStr(content.title);
  if (!title) throw new BadRequestException('FAQ title is required.');
  if (title.length > LIMITS.FAQ.title) throw new BadRequestException(`FAQ title must be ${LIMITS.FAQ.title} characters or less.`);
  assertNoXss(title, 'FAQ title');

  const items = parseItems(content.items, 'FAQ');
  if (items.length < LIMITS.FAQ.items.min) throw new BadRequestException(`You must have at least ${LIMITS.FAQ.items.min} FAQ.`);
  if (items.length > LIMITS.FAQ.items.max) throw new BadRequestException(`You can have a maximum of ${LIMITS.FAQ.items.max} FAQs.`);

  const seenQuestions = new Set<string>();
  items.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new BadRequestException(`FAQ ${index + 1} is invalid`);
    const question = trimStr(item.question);
    if (!question) throw new BadRequestException(`FAQ ${index + 1} question is required.`);
    if (question.length > LIMITS.FAQ.question) throw new BadRequestException(`FAQ ${index + 1} question must be ${LIMITS.FAQ.question} characters or less.`);
    assertNoXss(question, `FAQ ${index + 1} question`);

    const normalized = normalizeQuestion(question);
    if (seenQuestions.has(normalized)) throw new BadRequestException(`FAQ ${index + 1}: This question already exists.`);
    seenQuestions.add(normalized);

    const answer = trimStr(item.answer);
    if (!answer) throw new BadRequestException(`FAQ ${index + 1} answer is required.`);
    if (answer.length > LIMITS.FAQ.answer) throw new BadRequestException(`FAQ ${index + 1} answer must be ${LIMITS.FAQ.answer} characters or less.`);
    assertNoXss(answer, `FAQ ${index + 1} answer`);
  });
}

function validateSignupContent(content: Record<string, unknown>): void {
  const title = trimStr(content.title);
  if (!title) throw new BadRequestException('Form title is required.');
  if (title.length > LIMITS.SIGNUP.title) throw new BadRequestException(`Form title must be ${LIMITS.SIGNUP.title} characters or less.`);
  assertNoXss(title, 'Form title');

  const subtitle = trimStr(content.subtitle);
  if (subtitle) {
    if (subtitle.length > LIMITS.SIGNUP.subtitle) throw new BadRequestException(`Form subtitle must be ${LIMITS.SIGNUP.subtitle} characters or less.`);
    assertNoXss(subtitle, 'Form subtitle');
  }
}

function validateSocialProofContent(content: Record<string, unknown>): void {
  const title = trimStr(content.title);
  if (!title) throw new BadRequestException('Social proof title is required.');
  if (title.length > LIMITS.SOCIAL_PROOF.title) throw new BadRequestException(`Social proof title must be ${LIMITS.SOCIAL_PROOF.title} characters or less.`);
  assertNoXss(title, 'Social proof title');

  const description = trimStr(content.description);
  if (description) {
    if (description.length > LIMITS.SOCIAL_PROOF.description) throw new BadRequestException(`Social proof description must be ${LIMITS.SOCIAL_PROOF.description} characters or less.`);
    assertNoXss(description, 'Social proof description');
  }

  const screenshotUrl = trimStr(content.screenshotUrl);
  if (!screenshotUrl) throw new BadRequestException('Social proof screenshot is required.');
  // Validate URL format: must start with http or https
  if (!/^https?:\/\/.+/i.test(screenshotUrl)) throw new BadRequestException('Social proof screenshot URL is invalid.');
  assertNoXss(screenshotUrl, 'Social proof screenshot URL');
}

function validateFooterContent(content: Record<string, unknown>): void {
  const title = trimStr(content.title);
  if (!title) throw new BadRequestException('Footer title is required.');
  if (title.length > LIMITS.FOOTER.title) throw new BadRequestException(`Footer title must be ${LIMITS.FOOTER.title} characters or less.`);
  assertNoXss(title, 'Footer title');

  const text = trimStr(content.text);
  if (!text) throw new BadRequestException('Footer text is required.');
  if (text.length > LIMITS.FOOTER.text) throw new BadRequestException(`Footer text must be ${LIMITS.FOOTER.text} characters or less.`);
  assertNoXss(text, 'Footer text');
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

function validateSectionContent(type: PageSectionType, content: Record<string, unknown>): void {
  // Global XSS guard: check serialised content size and injection patterns
  const serialized = JSON.stringify(content);
  if (serialized.length > 20_000) throw new BadRequestException(`${type} content exceeds maximum size`);
  if (/<\s*script|javascript:/i.test(serialized)) throw new BadRequestException(`${type} contains unsupported content`);

  switch (type) {
    case 'HERO':         return validateHeroContent(content);
    case 'FEATURES':     return validateFeaturesContent(content);
    case 'FAQ':          return validateFaqContent(content);
    case 'SIGNUP':       return validateSignupContent(content);
    case 'SOCIAL_PROOF': return validateSocialProofContent(content);
    case 'FOOTER':       return validateFooterContent(content);
  }
}

// Suppress unused-import lint warning — requireString is a utility kept for future use
void requireString;
