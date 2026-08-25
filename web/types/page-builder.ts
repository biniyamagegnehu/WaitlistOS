export const PAGE_SECTION_TYPES = ["HERO", "FEATURES", "FAQ", "SIGNUP", "SOCIAL_PROOF", "FOOTER"] as const;
export type PageSectionType = (typeof PAGE_SECTION_TYPES)[number];
export interface PageSection { id: string; type: PageSectionType; order: number; visible: boolean; content: Record<string, unknown>; layout?: Record<string, unknown>; style?: Record<string, unknown>; responsive?: Record<string, unknown>; }
export interface PageConfig { version: 1; mode?: "CUSTOMIZE_ORIGINAL" | "FROM_SCRATCH"; theme?: Record<string, unknown>; sections: PageSection[]; }
export interface PageBuilderResponse { draftConfig: PageConfig; publishedConfig: PageConfig | null; version: number; }

export const sectionLabel: Record<PageSectionType, string> = { HERO: "Hero", FEATURES: "Features", FAQ: "FAQ", SIGNUP: "Waitlist form", SOCIAL_PROOF: "Social proof", FOOTER: "Footer" };
export const singletonSections: PageSectionType[] = ["HERO", "SIGNUP", "FOOTER"];
export function defaultSection(type: PageSectionType): PageSection {
  const id = `${type.toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`;
  const content: Record<string, unknown> = type === "HERO" ? { headline: "", subheadline: "", description: "" } : type === "SOCIAL_PROOF" ? { title: "Loved by early adopters", description: "", screenshotUrl: "" } : type === "FEATURES" ? { title: "Why join?", columns: "3", items: "[]" } : type === "FAQ" ? { title: "Frequently asked questions", items: "[]" } : type === "SIGNUP" ? { title: "Join the waitlist", subtitle: "" } : { text: "" };
  return { id, type, order: 0, visible: true, content, layout: { width: "large", alignment: "center", spacing: "medium" }, style: { background: "default", cardStyle: "default" }, responsive: { mobileColumns: 1 } };
}
