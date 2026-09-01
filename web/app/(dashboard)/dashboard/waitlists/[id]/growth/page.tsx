"use client";

import * as React from "react";
import { BackButton } from "@/components/navigation/back-button";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { LoadingState } from "@/components/patterns/loading-state";
import { ErrorState } from "@/components/patterns/error-state";
import { MetricCard } from "@/components/patterns/metric-card";
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
  const router = useRouter();
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
      <PageContainer>
        <LoadingState variant="skeleton" skeletonCount={4} />
      </PageContainer>
    );
  }

  if (error || !detail) {
    return (
      <PageContainer>
        <ErrorState
          title="Waitlist not found"
          description={error ?? "This waitlist could not be loaded."}
          onHome={() => router.push(routes.waitlists)}
        />
      </PageContainer>
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
    <PageContainer>
      <BackButton href={routes.waitlist(waitlistId)} label="Back to waitlist" className="mb-4" />
      <PageHeader
        title="Growth Engine"
        description="Boost referrals, engagement, collaboration, and conversions using WaitlistOS Growth Engine."
        breadcrumbs={[
          { label: waitlist.name, href: routes.waitlist(waitlistId) },
          { label: "Growth Engine" },
        ]}
      />

      {/* Growth Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          label="Total Features"
          value="4"
        />
        <MetricCard
          label="Enabled"
          value={enabledCount}
          status={enabledCount > 0 ? "success" : "neutral"}
        />
        <MetricCard
          label="Disabled"
          value={4 - enabledCount}
        />
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
    </PageContainer>
  );
}
