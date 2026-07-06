import { cache } from "react";
import type { ReferralOgApiResponse, ReferralOgData } from "@/types/referral-og";
import { getApiUrl, getAppUrl } from "@/lib/og";
import { routes } from "@/lib/routes";

async function fetchReferralOgDataFromApi(
  referralCode: string,
  options?: { cache?: RequestCache }
): Promise<ReferralOgData | null> {
  const trimmedCode = referralCode.trim();
  if (!trimmedCode) {
    return null;
  }

  try {
    const response = await fetch(
      `${getApiUrl()}/api/referrals/${encodeURIComponent(trimmedCode)}`,
      options?.cache
        ? { cache: options.cache }
        : { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as ReferralOgApiResponse;
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchReferralOgDataUncached(
  referralCode: string
): Promise<ReferralOgData | null> {
  return fetchReferralOgDataFromApi(referralCode, { cache: "no-store" });
}

export const fetchReferralOgData = cache(fetchReferralOgDataFromApi);

export function getShareableReferralPath(referralCode: string): string {
  return routes.referral(referralCode);
}

export function getShareableReferralUrl(
  referralCode: string,
  origin?: string
): string {
  const base = origin ?? getAppUrl();
  return `${base}${getShareableReferralPath(referralCode)}`;
}
