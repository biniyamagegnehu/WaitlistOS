"use client";

import React, { useEffect, useState, use } from "react";
import { BackButton } from "@/components/navigation/back-button";
import { useRouter } from "next/navigation";
import { TrendingUp, Users, MousePointer2, Send, Share2 } from "lucide-react";

import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { LoadingState } from "@/components/patterns/loading-state";
import { ErrorState } from "@/components/patterns/error-state";
import { MetricCard } from "@/components/patterns/metric-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { FunnelVisualization } from "@/components/analytics/FunnelVisualization";

import { getConversionFunnel, ConversionFunnelResponse } from "@/services/analytics";
import { getDashboardWaitlistDetail } from "@/services/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";

export default function AnalyticsFunnelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: waitlistId } = use(params);
  const router = useRouter();

  const [funnel, setFunnel] = useState<ConversionFunnelResponse | null>(null);
  const [waitlistName, setWaitlistName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>("30");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const detail = await getDashboardWaitlistDetail(waitlistId);
        setWaitlistName(detail.waitlist.name);

        const now = new Date();
        let fromDate: string | undefined = undefined;

        if (dateRange !== "all") {
          const days = parseInt(dateRange, 10);
          const from = new Date();
          from.setDate(now.getDate() - days);
          fromDate = from.toISOString();
        }

        const data = await getConversionFunnel(waitlistId, fromDate);
        setFunnel(data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Unable to load conversion funnel analytics."));
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [waitlistId, dateRange]);

  if (isLoading) {
    return <LoadingState variant="skeleton" skeletonCount={6} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error loading analytics"
        description={error}
        onRetry={() => window.location.reload()}
        onHome={() => router.push(routes.waitlist(waitlistId))}
      />
    );
  }

  if (!funnel) return null;

  const hasData = funnel.pageVisits > 0 || funnel.formFocus > 0 || funnel.signupSubmitted > 0 || funnel.referralShared > 0;

  return (
    <PageContainer>
      <BackButton href={routes.waitlist(waitlistId)} label="Back to waitlist" className="mb-4" />
      <PageHeader
        title="Conversion Funnel"
        description="Track how visitors move through your waitlist signup process."
        breadcrumbs={[
          { label: waitlistName || "Waitlist", href: routes.waitlist(waitlistId) },
          { label: "Analytics" },
          { label: "Conversion Funnel" },
        ]}
        primaryAction={
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground hidden sm:inline">Period</span>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              size="sm"
              aria-label="Select date range"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </Select>
          </div>
        }
      />

      {!hasData ? (
        <EmptyState
          title="No funnel data yet."
          description="Share your waitlist link with your audience and your conversion funnel data will appear here."
          action={
            <Button onClick={() => router.push(routes.waitlistShare(waitlistId))} leftIcon={<Share2 className="h-4 w-4" />}>Share Waitlist</Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              label="Page Visits"
              value={funnel.pageVisits.toLocaleString()}
              icon={<Users className="h-4 w-4" />}
            />
            <MetricCard
              label="Form Focus"
              value={funnel.formFocus.toLocaleString()}
              icon={<MousePointer2 className="h-4 w-4" />}
            />
            <MetricCard
              label="Signups"
              value={funnel.signupSubmitted.toLocaleString()}
              icon={<Send className="h-4 w-4" />}
            />
            <MetricCard
              label="Referrals Shared"
              value={funnel.referralShared.toLocaleString()}
              icon={<Share2 className="h-4 w-4" />}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>
                Visual representation of user journey from page visit to referral sharing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FunnelVisualization steps={funnel.steps} />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Overall Signup Conversion</CardTitle>
                <CardDescription>
                  Percentage of visitors who completed signup.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {funnel.overallSignupConversion !== null ? (
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold">{funnel.overallSignupConversion}%</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>{funnel.signupSubmitted} of {funnel.pageVisits} visitors</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral Share Rate</CardTitle>
                <CardDescription>
                  Percentage of users who shared their referral link.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {funnel.referralShareRate !== null ? (
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold">{funnel.referralShareRate}%</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Share2 className="h-4 w-4" />
                      <span>{funnel.referralShared} of {funnel.signupSubmitted} signups</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </PageContainer>
  );
}
