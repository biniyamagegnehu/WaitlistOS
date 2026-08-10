"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Users, MousePointer2, Send, Share2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { FunnelVisualization } from "@/components/analytics/FunnelVisualization";

import { getConversionFunnel, ConversionFunnelResponse } from "@/services/analytics";
import { getDashboardWaitlistDetail } from "@/services/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";

export default function AnalyticsFunnelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: waitlistId } = use(params);

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
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton variant="rectangular" className="h-32" />
          <Skeleton variant="rectangular" className="h-32" />
          <Skeleton variant="rectangular" className="h-32" />
          <Skeleton variant="rectangular" className="h-32" />
        </div>
        <Skeleton variant="rectangular" className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Error loading analytics"
        description={error}
        action={
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Try again
          </Button>
        }
      />
    );
  }

  if (!funnel) return null;

  const hasData = funnel.pageVisits > 0 || funnel.formFocus > 0 || funnel.signupSubmitted > 0 || funnel.referralShared > 0;

  return (
    <div className="space-y-6">
      <Link
        href={routes.waitlist(waitlistId)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {waitlistName || "Waitlist"}
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Conversion Funnel"
          description="Track how visitors move through your waitlist signup process."
        />
        
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {!hasData ? (
        <EmptyState
          title="No funnel data yet."
          description="Share your waitlist link with your audience and your conversion funnel data will appear here."
          action={
            <Link href={routes.waitlistShare(waitlistId)}>
              <Button leftIcon={<Share2 className="h-4 w-4" />}>Share Waitlist</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Page Visits</span>
                </div>
                <div className="mt-4 text-3xl font-bold">{funnel.pageVisits.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MousePointer2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Form Focus</span>
                </div>
                <div className="mt-4 text-3xl font-bold">{funnel.formFocus.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Send className="h-4 w-4" />
                  <span className="text-sm font-medium">Signups</span>
                </div>
                <div className="mt-4 text-3xl font-bold">{funnel.signupSubmitted.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Share2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Referrals Shared</span>
                </div>
                <div className="mt-4 text-3xl font-bold">{funnel.referralShared.toLocaleString()}</div>
              </CardContent>
            </Card>
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
    </div>
  );
}
