import type { ReactElement } from "react";
import { DefaultOgImage } from "@/components/og/DefaultOgImage";
import { ReferralOgImage } from "@/components/og/ReferralOgImage";
import { loadOgFonts } from "@/lib/og-fonts";
import { materializeOgImage } from "@/lib/og-response";
import { prepareReferralOgDataForImage } from "@/lib/og-render";
import { fetchReferralOgDataUncached } from "@/lib/referral";

export const runtime = "nodejs";

async function renderWithFallback(
  primary: ReactElement,
  fallback: ReactElement = <DefaultOgImage />
): Promise<Response> {
  const fonts = await loadOgFonts();
  const fontOptions = fonts.length > 0 ? { fonts } : undefined;

  try {
    return await materializeOgImage(primary, fontOptions);
  } catch {
    try {
      return await materializeOgImage(fallback, fontOptions);
    } catch {
      return await materializeOgImage(<DefaultOgImage />);
    }
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ referralCode: string }> }
) {
  const { referralCode } = await context.params;

  try {
    const data = await fetchReferralOgDataUncached(referralCode);

    if (!data) {
      return renderWithFallback(<DefaultOgImage />);
    }

    const prepared = await prepareReferralOgDataForImage(data);
    return renderWithFallback(<ReferralOgImage data={prepared} />);
  } catch {
    return renderWithFallback(<DefaultOgImage />);
  }
}
