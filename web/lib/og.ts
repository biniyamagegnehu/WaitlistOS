export const OG_SIZE = {
  width: 1200,
  height: 630,
} as const;

export const OG_COLORS = {
  background: "#FAF8F2",
  card: "#FFFFFF",
  primary: "#1F5C42",
  primaryHover: "#174B36",
  accent: "#D8A75B",
  text: "#1F2937",
  secondary: "#6B7280",
  border: "#E5E7EB",
} as const;

export const OG_CACHE_HEADERS: Record<string, string> = {
  "Cache-Control":
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

export const DEFAULT_WAITLISTOS_LOGO_DATA_URI =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#1F5C42"/>
      <path d="M34 14L22 34H30L28 50L42 28H34V14Z" fill="#FAF8F2"/>
    </svg>`
  );

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3001";
}

export function getApiUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3000").replace(
    /\/$/,
    ""
  );
}

export function getReferralOgImageUrl(referralCode: string, appUrl?: string): string {
  const base = appUrl ?? getAppUrl();
  return `${base}/og/referral/${encodeURIComponent(referralCode)}`;
}

export function getParticipantDisplayName(displayName: string | null | undefined): string {
  return displayName?.trim() || "Someone";
}
