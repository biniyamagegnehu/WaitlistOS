"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Flame, Clock, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { GrowthVelocityChart } from "@/components/analytics/GrowthVelocityChart";

import { getGrowthVelocity, GrowthVelocityResponse } from "@/services/analytics";
import { getDashboardWaitlistDetail } from "@/services/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";

export default function AnalyticsGrowthVelocityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: waitlistId } = use(params);

  const [growth, setGrowth] = useState<GrowthVelocityResponse | null>(null);
  const [waitlistName, setWaitlistName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>("30");
  const [viewMode, setViewMode] = useState<"hourly" | "daily">("hourly");

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

        const data = await getGrowthVelocity(waitlistId, fromDate);
        setGrowth(data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Unable to load growth velocity analytics."));
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
        <div className="grid gap-4 md:grid-cols-3">
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

  if (!growth) return null;

  const hasData = growth.hourly.length > 0 || growth.daily.length > 0;
  const currentData = viewMode === "hourly" ? growth.hourly : growth.daily;

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
          title="Growth Velocity"
          description="See how quickly your waitlist is growing and identify viral referral moments."
        />
        
        <div className="flex gap-2">
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

          <div className="flex rounded-md border border-input bg-background">
            <button
              onClick={() => setViewMode("hourly")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "hourly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Hourly
            </button>
            <button
              onClick={() => setViewMode("daily")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "daily"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Daily
            </button>
          </div>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          title="No growth data yet"
          description="Once visitors start joining your waitlist, you'll see your growth momentum here."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Signups</span>
                </div>
                <div className="mt-4 text-3xl font-bold">{growth.summary.totalSignups.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Peak Hour</span>
                </div>
                <div className="mt-4">
                  {growth.summary.peakHour ? (
                    <div>
                      <div className="text-3xl font-bold">{growth.summary.peakHour.signupCount.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(growth.summary.peakHour.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">No data available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-medium">Referral Spikes</span>
                </div>
                <div className="mt-4 text-3xl font-bold">{growth.summary.spikeCount}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Signup Growth</CardTitle>
              <CardDescription>
                {viewMode === "hourly" ? "Signups per hour" : "Signups per day"} with viral referral moments marked.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GrowthVelocityChart
                data={currentData}
                spikes={growth.spikes}
                viewMode={viewMode}
              />
            </CardContent>
          </Card>

          {growth.spikes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Referral Spike Details</CardTitle>
                <CardDescription>
                  Moments when 5+ people joined through the same referral link within one hour.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {growth.spikes.map((spike) => (
                    <div
                      key={spike.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border bg-surface"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
                        <Flame className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-foreground">
                            {spike.signupCount} signups
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(spike.startAt).toLocaleString()} – {new Date(spike.endAt).toLocaleString()}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {spike.signupCount} people joined through this referral within{" "}
                          {Math.round((new Date(spike.endAt).getTime() - new Date(spike.startAt).getTime()) / 60000)} minutes.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {hasData && growth.spikes.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Flame className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-semibold text-foreground mb-2">No referral spikes detected yet</h3>
                <p className="text-sm text-muted-foreground">
                  Referral spikes appear when 5 or more people join through the same referral link within one hour.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
