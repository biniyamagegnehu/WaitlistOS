import type { Metadata } from "next";
import PublicWaitlistPageClient from "@/components/waitlist/PublicWaitlistPageClient";
import { PublicThemeScript } from "@/components/waitlist/PublicThemeScript";
import { buildReferralMetadata } from "@/lib/metadata";
import { fetchReferralOgData } from "@/lib/referral";
import { AnalyticsTracker } from "@/components/waitlist/AnalyticsTracker";

interface WaitlistPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";

async function fetchThemeMode(slug: string): Promise<"SYSTEM" | "LIGHT" | "DARK"> {
  try {
    const res = await fetch(`${API_URL}/api/w/${slug}`, {
      // revalidate every 60s so theme changes propagate quickly
      next: { revalidate: 60 },
    });
    if (!res.ok) return "SYSTEM";
    const json = await res.json();
    const mode = json?.data?.waitlist?.themeMode;
    if (mode === "LIGHT" || mode === "DARK" || mode === "SYSTEM") return mode;
    return "SYSTEM";
  } catch {
    return "SYSTEM";
  }
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
    title: `Join ${slug} | Getlist`,
    description: "Join the waitlist and secure your spot.",
  };
}

export default async function PublicWaitlistPage({ params }: WaitlistPageProps) {
  const { slug } = await params;
  const themeMode = await fetchThemeMode(slug);

  return (
    <>
      <PublicThemeScript themeMode={themeMode} />
      <AnalyticsTracker />
      <PublicWaitlistPageClient />
    </>
  );
}
