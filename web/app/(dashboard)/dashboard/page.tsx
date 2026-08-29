"use client";

import * as React from "react";
import Link from "next/link";
import { Users, TrendingUp, Trophy, List, Activity, AlertTriangle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/patterns/loading-state";
import { ErrorState } from "@/components/patterns/error-state";
import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { MetricCard } from "@/components/patterns/metric-card";
import { getDashboardOverview } from "@/services/dashboard";
import type { DashboardOverview } from "@/types/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";

export default function DashboardPage() {
  const [overview, setOverview] = React.useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    getDashboardOverview()
      .then(setOverview)
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Failed to load dashboard"));
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState variant="skeleton" skeletonCount={5} />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          title="Unable to load dashboard"
          description={error}
          onRetry={() => window.location.reload()}
        />
      </PageContainer>
    );
  }

  const stats = overview ?? {
    totalSignups: 0,
    referralConversionRate: 0,
    topReferrers: [],
    waitlistCount: 0,
    health: {
      healthy: 0,
      mediumRisk: 0,
      highRisk: 0,
    }
  };

  const totalAtRisk = stats.health.mediumRisk + stats.health.highRisk;

  return (
    <PageContainer>
      <div className="space-y-8">
        <PageHeader
          title="Dashboard"
          description="Overview of your waitlist performance"
          primaryAction={
            <Link href={routes.create}>
              <Button leftIcon={<Plus className="h-4 w-4" />}>Create waitlist</Button>
            </Link>
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Total signups"
            value={stats.totalSignups.toLocaleString()}
            icon={<Users className="h-5 w-5" />}
          />
          <MetricCard
            label="Referral conversion"
            value={`${stats.referralConversionRate}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            description="Signups that joined via a referral link"
          />
          <MetricCard
            label="Active waitlists"
            value={stats.waitlistCount.toLocaleString()}
            icon={<List className="h-5 w-5" />}
          />
        </div>

      {/* Waitlist Health Metrics */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Waitlist Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-muted">Total Participants</span>
                <span className="font-semibold text-text-primary">{stats.totalSignups.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  <span className="text-sm text-text-primary">Healthy</span>
                </div>
                <span className="font-semibold text-text-primary">{stats.health.healthy.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning"></div>
                  <span className="text-sm text-text-primary">Medium Risk</span>
                </div>
                <span className="font-semibold text-text-primary">{stats.health.mediumRisk.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-error"></div>
                  <span className="text-sm text-text-primary">High Risk</span>
                </div>
                <span className="font-semibold text-text-primary">{stats.health.highRisk.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              At-Risk Participants
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[180px] text-center">
            {totalAtRisk > 0 ? (
              <>
                <p className="text-4xl font-bold text-text-primary mb-2">{totalAtRisk.toLocaleString()}</p>
                <p className="text-sm text-text-muted">participants need re-engagement</p>
                <p className="text-xs text-text-muted mt-2">
                  Re-engagement emails are queued automatically for high-risk users.
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-success" />
                </div>
                <p className="text-sm font-medium text-text-primary">All participants are healthy!</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            Top referrers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topReferrers.length === 0 ? (
            <p className="text-sm text-text-muted">
              No referrals yet. Share waitlist links to start tracking referrers.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topReferrers.map((referrer, index) => (
                <div
                  key={`${referrer.email}-${index}`}
                  className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">
                      {referrer.email}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      {referrer.waitlistName}
                    </p>
                  </div>
                  <Badge variant="success">{referrer.referralCount} referrals</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </PageContainer>
  );
}
