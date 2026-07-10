import { redirect } from "next/navigation";
import { buildReferralMetadata } from "@/lib/metadata";
import { fetchReferralOgData } from "@/lib/referral";
import { routes } from "@/lib/routes";

interface ReferralPageProps {
  params: Promise<{ referralCode: string }>;
}

export async function generateMetadata({ params }: ReferralPageProps) {
  const { referralCode } = await params;
  const data = await fetchReferralOgData(referralCode);
  return buildReferralMetadata(referralCode, data);
}

export default async function ReferralPage({ params }: ReferralPageProps) {
  const { referralCode } = await params;
  const data = await fetchReferralOgData(referralCode);

  if (!data) {
    redirect(routes.home);
  }

  // Redirect directly to the waitlist page with the referral code
  const joinUrl = `${routes.waitlistPublic(data.waitlist.slug)}?ref=${encodeURIComponent(referralCode)}`;
  redirect(joinUrl);
}
