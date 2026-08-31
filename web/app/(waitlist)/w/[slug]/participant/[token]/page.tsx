import { Metadata } from "next";
import ParticipantPageClient from "@/components/participant/ParticipantPageClient";
import { PublicThemeScript } from "@/components/waitlist/PublicThemeScript";
import { AnalyticsTracker } from "@/components/waitlist/AnalyticsTracker";

interface PageProps {
  params: Promise<{ slug: string; token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Your Waitlist Status | ${slug}`,
    description: "Check your waitlist position and referrals.",
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";

async function fetchThemeMode(slug: string): Promise<"SYSTEM" | "LIGHT" | "DARK"> {
  try {
    const res = await fetch(`${API_URL}/api/w/${slug}`, {
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

export default async function ParticipantPage({ params }: PageProps) {
  const { slug, token } = await params;
  const themeMode = await fetchThemeMode(slug);

  return (
    <>
      <PublicThemeScript themeMode={themeMode} />
      <AnalyticsTracker />
      <ParticipantPageClient slug={slug} token={token} />
    </>
  );
}
