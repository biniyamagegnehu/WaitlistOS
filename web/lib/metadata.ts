import type { Metadata } from "next";
import type { ReferralOgData } from "@/types/referral-og";
import {
  getAppUrl,
  getParticipantDisplayName,
  getReferralOgImageUrl,
  OG_SIZE,
} from "@/lib/og";
import { routes } from "@/lib/routes";

const DEFAULT_TITLE = "WaitlistOS";
const DEFAULT_DESCRIPTION =
  "Create and manage referral-based waitlists for your product launch.";

function buildOgImageMeta(imageUrl: string, alt: string) {
  return {
    url: imageUrl,
    width: OG_SIZE.width,
    height: OG_SIZE.height,
    alt,
  };
}

export function buildDefaultReferralMetadata(referralCode: string): Metadata {
  const appUrl = getAppUrl();
  const imageUrl = getReferralOgImageUrl(referralCode, appUrl);

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    openGraph: {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      url: `${appUrl}${routes.referral(referralCode)}`,
      siteName: "WaitlistOS",
      type: "website",
      images: [buildOgImageMeta(imageUrl, DEFAULT_TITLE)],
    },
    twitter: {
      card: "summary_large_image",
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      images: [imageUrl],
    },
  };
}

export function buildReferralMetadata(
  referralCode: string,
  data: ReferralOgData | null
): Metadata {
  if (!data) {
    return buildDefaultReferralMetadata(referralCode);
  }

  const appUrl = getAppUrl();
  const participantName = getParticipantDisplayName(data.participant.displayName);
  const title = `${participantName} is #${data.participant.position} on ${data.waitlist.name}`;
  const description = `Join ${data.waitlist.name} — ${data.waitlist.tagline}. Invite friends to move up the waitlist.`;
  const imageUrl = getReferralOgImageUrl(referralCode, appUrl);
  const pageUrl = `${appUrl}${routes.referral(referralCode)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: data.waitlist.name,
      type: "website",
      images: [buildOgImageMeta(imageUrl, title)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
