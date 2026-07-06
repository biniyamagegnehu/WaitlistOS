import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
import { DefaultOgImage } from "@/components/og/DefaultOgImage";
import { ReferralOgImage } from "@/components/og/ReferralOgImage";
import { loadOgFonts } from "@/lib/og-fonts";
import { OG_CACHE_HEADERS, OG_SIZE } from "@/lib/og";
import { prepareReferralOgDataForImage } from "@/lib/og-render";
import { fetchReferralOgDataUncached } from "@/lib/referral";

export const runtime = "nodejs";

async function renderOgImage(element: ReactElement) {
  const fonts = await loadOgFonts();

  return new ImageResponse(element, {
    width: OG_SIZE.width,
    height: OG_SIZE.height,
    fonts,
    headers: OG_CACHE_HEADERS,
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ referralCode: string }> }
) {
  const { referralCode } = await context.params;

  try {
    const data = await fetchReferralOgDataUncached(referralCode);

    if (!data) {
      return renderOgImage(<DefaultOgImage />);
    }

    const prepared = await prepareReferralOgDataForImage(data);
    return renderOgImage(<ReferralOgImage data={prepared} />);
  } catch {
    return renderOgImage(<DefaultOgImage />);
  }
}
