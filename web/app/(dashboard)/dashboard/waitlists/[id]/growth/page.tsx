"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { getDashboardWaitlistDetail } from "@/services/dashboard";
import type { DashboardWaitlistDetail } from "@/types/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";

import { DoubleSidedRewardsCard } from "@/components/dashboard/growth/DoubleSidedRewardsCard";
import { StreakBonusesCard } from "@/components/dashboard/growth/StreakBonusesCard";
import { TeamReferralsCard } from "@/components/dashboard/growth/TeamReferralsCard";
import { UrgencyEngineCard } from "@/components/dashboard/growth/UrgencyEngineCard";

export default function GrowthSettingsPage() {
  const params = useParams();
  const waitlistId = params?.id as string;

  const [detail, setDetail] = React.useState<DashboardWaitlistDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!waitlistId) return;

    getDashboardWaitlistDetail(waitlistId)
      .then(setDetail)
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Failed to load waitlist"));
      })
      .finally(() => setIsLoading(false));
  }, [waitlistId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-10 w-72" />
        <Skeleton variant="rectangular" className="h-64" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <EmptyState
        title="Waitlist not found"
        description={error ?? "This waitlist could not be loaded."}
        action={
          <Link href={routes.waitlists}>
            <Button variant="secondary">Back to waitlists</Button>
          </Link>
        }
      />
    );
  }

  const { waitlist } = detail;

  const features = [
    { name: "Double-Sided Rewards", enabled: waitlist.doubleSidedRewardsEnabled },
    { name: "Streak Bonuses", enabled: waitlist.streakBonusesEnabled },
    { name: "Team Referrals", enabled: waitlist.teamReferralsEnabled },
    { name: "Urgency Engine", enabled: waitlist.urgencyEnabled },
  ];

  const enabledCount = features.filter((f) => f.enabled).length;

  return (
    <div className="space-y-6">
      <Link
        href={routes.waitlist(waitlistId)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {waitlist.name}
      </Link>

      <SectionHeader
        title="Growth Engine"
        description="Boost referrals, engagement, collaboration, and conversions using WaitlistOS Growth Engine."
      />

      {/* Growth Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Total Features</p>
          <p className="text-2xl font-bold text-foreground">4</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Enabled</p>
          <p className="text-2xl font-bold text-success">{enabledCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Disabled</p>
          <p className="text-2xl font-bold text-muted-foreground">{4 - enabledCount}</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Referral Growth */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Referral Growth</h2>
          <DoubleSidedRewardsCard waitlistId={waitlistId} initialData={waitlist} />
        </div>

        {/* Engagement */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Engagement</h2>
          <StreakBonusesCard waitlistId={waitlistId} initialData={waitlist} />
        </div>

        {/* Community */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Community</h2>
          <TeamReferralsCard waitlistId={waitlistId} initialData={waitlist} />
        </div>

        {/* Conversion */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Conversion</h2>
          <UrgencyEngineCard waitlistId={waitlistId} initialData={waitlist} />
        </div>
      </div>
    </div>
  );
}
