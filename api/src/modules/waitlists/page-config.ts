import { BadRequestException } from '@nestjs/common';

export const PAGE_SECTION_TYPES = ['HERO', 'FEATURES', 'FAQ', 'SIGNUP', 'SOCIAL_PROOF', 'FOOTER'] as const;
export type PageSectionType = (typeof PAGE_SECTION_TYPES)[number];
export interface PageSection { id: string; type: PageSectionType; order: number; visible: boolean; content: Record<string, unknown>; layout?: Record<string, unknown>; style?: Record<string, unknown>; responsive?: Record<string, unknown>; }
export interface PageConfig { version: 1; theme?: Record<string, unknown>; sections: PageSection[]; }

export function defaultPageConfig(): PageConfig {
  return { version: 1, theme: { primaryColor: '', background: '', text: '', mutedText: '', containerWidth: 'large', sectionSpacing: 'medium', buttonStyle: 'solid', buttonSize: 'medium', buttonRadius: 'rounded', headingFont: 'inherit', bodyFont: 'inherit' }, sections: [
    { id: 'hero', type: 'HERO', order: 0, visible: true, content: {} },
    { id: 'social-proof', type: 'SOCIAL_PROOF', order: 1, visible: true, content: {} },
    { id: 'features', type: 'FEATURES', order: 2, visible: true, content: {} },
    { id: 'signup', type: 'SIGNUP', order: 3, visible: true, content: {} },
    { id: 'faq', type: 'FAQ', order: 4, visible: true, content: {} },
    { id: 'footer', type: 'FOOTER', order: 5, visible: true, content: {} },
  ] };
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
    validateContent(type, value.content as Record<string, unknown>);
    validateOptions(value.layout, `${type}.layout`); validateOptions(value.style, `${type}.style`); validateOptions(value.responsive, `${type}.responsive`);
    return { id: value.id, type, order: index, visible: value.visible, content: value.content as Record<string, unknown>, ...(value.layout ? { layout: value.layout as Record<string, unknown> } : {}), ...(value.style ? { style: value.style as Record<string, unknown> } : {}), ...(value.responsive ? { responsive: value.responsive as Record<string, unknown> } : {}) };
  });
  if (!sections.some((section) => section.type === 'SIGNUP')) throw new BadRequestException('A Signup section is required');
  return { version: 1, ...(config.theme ? { theme: config.theme as Record<string, unknown> } : {}), sections };
}

function validateOptions(value: unknown, label: string) {
  if (value === undefined) return;
  if (!value || typeof value !== 'object' || Array.isArray(value) || JSON.stringify(value).length > 4_000) throw new BadRequestException(`${label} is invalid`);
  const serialized = JSON.stringify(value);
  if (/<\s*script|javascript:|expression\s*\(/i.test(serialized)) throw new BadRequestException(`${label} contains unsupported values`);
}

function validateContent(type: PageSectionType, content: Record<string, unknown>) {
  const serialized = JSON.stringify(content);
  if (serialized.length > 20_000 || /<\s*script|javascript:/i.test(serialized)) throw new BadRequestException(`${type} contains unsupported content`);
  for (const [key, value] of Object.entries(content)) if (typeof value === 'string' && value.length > 2_000) throw new BadRequestException(`${type}.${key} is too long`);
  if (type === 'FEATURES' && Array.isArray(content.items) && content.items.length > 6) throw new BadRequestException('Features supports up to 6 items');
  if (type === 'FAQ' && Array.isArray(content.items) && content.items.length > 10) throw new BadRequestException('FAQ supports up to 10 items');
}
