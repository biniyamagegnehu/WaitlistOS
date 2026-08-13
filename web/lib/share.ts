export const SHARE_PLATFORMS = {
  twitter: { label: "X", source: "twitter", medium: "social" },
  whatsapp: { label: "WhatsApp", source: "whatsapp", medium: "social" },
  telegram: { label: "Telegram", source: "telegram", medium: "social" },
  email: { label: "Email", source: "email", medium: "email" },
  producthunt: { label: "Product Hunt", source: "producthunt", medium: "referral" },
} as const;

export type SharePlatform = keyof typeof SHARE_PLATFORMS;

export interface GenerateShareUrlOptions {
  waitlistSlug: string;
  platform: SharePlatform;
  referralCode?: string;
  campaign?: string;
  origin?: string;
  existingParams?: URLSearchParams;
}

export function generateShareUrl({ waitlistSlug, platform, referralCode, campaign, origin, existingParams }: GenerateShareUrlOptions) {
  // Prefer the configured public app URL so share links still work behind a proxy
  // or custom domain. Fall back to the active browser origin during local use.
  const base = origin ?? process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "");
  const url = new URL(`/w/${encodeURIComponent(waitlistSlug)}`, base || "https://waitlistos.local");
  existingParams?.forEach((value, key) => url.searchParams.set(key, value));
  if (referralCode) url.searchParams.set("ref", referralCode);
  const config = SHARE_PLATFORMS[platform];
  url.searchParams.set("utm_source", config.source);
  url.searchParams.set("utm_medium", config.medium);
  if (campaign) url.searchParams.set("utm_campaign", campaign);
  return base ? url.toString() : `${url.pathname}${url.search}`;
}

export function getShareTarget(platform: SharePlatform, url: string, title: string) {
  const withParams = (base: string, params: Record<string, string>) => {
    const target = new URL(base);
    Object.entries(params).forEach(([key, value]) => target.searchParams.set(key, value));
    return target.toString();
  };
  switch (platform) {
    case "twitter": return withParams("https://x.com/intent/post", { url, text: title });
    case "whatsapp": return withParams("https://wa.me/", { text: `${title} ${url}` });
    case "telegram": return withParams("https://t.me/share/url", { url, text: title });
    case "email": return withParams("mailto:", { subject: title, body: `${title}\n\n${url}` });
    case "producthunt": return withParams("https://www.producthunt.com/posts/new", { url });
    default: return null;
  }
}
