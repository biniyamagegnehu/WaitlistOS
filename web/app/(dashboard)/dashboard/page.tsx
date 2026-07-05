"use client";

import * as React from "react";
import Link from "next/link";
import { Users, TrendingUp, Trophy, List } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
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
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" className="h-28" />
          ))}
        </div>
        <Skeleton variant="rectangular" className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load dashboard"
        description={error}
        action={
          <Button onClick={() => window.location.reload()}>Try again</Button>
        }
      />
    );
  }

  const stats = overview ?? {
    totalSignups: 0,
    referralConversionRate: 0,
    topReferrers: [],
    waitlistCount: 0,
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Dashboard"
        description="Overview of your waitlist performance"
        action={
          <Link href={routes.create}>
            <Button>Create waitlist</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total signups"
          value={stats.totalSignups.toLocaleString()}
          icon={<Users className="h-5 w-5 text-primary" />}
        />
        <StatCard
          label="Referral conversion"
          value={`${stats.referralConversionRate}%`}
          icon={<TrendingUp className="h-5 w-5 text-success" />}
          helper="Signups that joined via a referral link"
        />
        <StatCard
          label="Active waitlists"
          value={stats.waitlistCount.toLocaleString()}
          icon={<List className="h-5 w-5 text-accent" />}
        />
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
            <p className="text-sm text-muted-foreground">
              No referrals yet. Share waitlist links to start tracking referrers.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topReferrers.map((referrer, index) => (
                <div
                  key={`${referrer.email}-${index}`}
                  className="flex items-center justify-between gap-4 rounded-md border border-border bg-background px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {referrer.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
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
  );
}

function StatCard({
  label,
  value,
  icon,
  helper,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  helper?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="rounded-md bg-surface-muted p-2">{icon}</div>
        </div>
        <p className="text-3xl font-semibold text-foreground">{value}</p>
        {helper && <p className="mt-2 text-xs text-muted-foreground">{helper}</p>}
      </CardContent>
    </Card>
  );
}
