import type { Metadata } from "next";
import PublicWaitlistPageClient from "@/components/waitlist/PublicWaitlistPageClient";
import { buildReferralMetadata } from "@/lib/metadata";
import { fetchReferralOgData } from "@/lib/referral";

interface WaitlistPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: WaitlistPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { ref } = await searchParams;

  if (ref) {
    const data = await fetchReferralOgData(ref);
    return buildReferralMetadata(ref, data);
  }

  return {
    title: `Join ${slug} | WaitlistOS`,
    description: "Join the waitlist and secure your spot.",
  };
}

export default function PublicWaitlistPage() {
  return <PublicWaitlistPageClient />;
}
