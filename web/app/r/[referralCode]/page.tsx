import Link from "next/link";
import { redirect } from "next/navigation";
import { buildReferralMetadata } from "@/lib/metadata";
import { getParticipantDisplayName } from "@/lib/og";
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

  const participantName = getParticipantDisplayName(data.participant.displayName);
  const joinUrl = `${routes.waitlistPublic(data.waitlist.slug)}?ref=${encodeURIComponent(referralCode)}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {data.waitlist.name}
        </p>
        <h1 className="mb-2 text-3xl font-semibold text-foreground">
          {participantName} is #{data.participant.position}
        </h1>
        <p className="mb-6 text-muted-foreground">{data.waitlist.tagline}</p>
        <p className="mb-8 text-sm text-muted-foreground">
          Join the waitlist and invite friends to move up.
        </p>
        <Link
          href={joinUrl}
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Join the waitlist
        </Link>
      </div>
    </main>
  );
}
