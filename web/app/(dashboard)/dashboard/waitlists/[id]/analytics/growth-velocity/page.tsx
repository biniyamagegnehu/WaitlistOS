"use client";

import React, { useEffect, useState, use } from "react";
import { BackButton } from "@/components/navigation/back-button";
import { useRouter } from "next/navigation";
import { Flame, Clock, Users } from "lucide-react";

import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { LoadingState } from "@/components/patterns/loading-state";
import { ErrorState } from "@/components/patterns/error-state";
import { MetricCard } from "@/components/patterns/metric-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { GrowthVelocityChart } from "@/components/analytics/GrowthVelocityChart";

import { getGrowthVelocity, GrowthVelocityResponse } from "@/services/analytics";
import { getDashboardWaitlistDetail } from "@/services/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";

export default function AnalyticsGrowthVelocityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: waitlistId } = use(params);
  const router = useRouter();

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
    return <LoadingState variant="skeleton" skeletonCount={5} />;
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

  if (!growth) return null;

  const hasData = growth.hourly.length > 0 || growth.daily.length > 0;
  const currentData = viewMode === "hourly" ? growth.hourly : growth.daily;

  return (
    <PageContainer>
      <BackButton href={routes.waitlist(waitlistId)} label="Back to waitlist" className="mb-4" />
      <PageHeader
        title="Growth Velocity"
        description="See how quickly your waitlist is growing and identify viral referral moments."
        breadcrumbs={[
          { label: waitlistName || "Waitlist", href: routes.waitlist(waitlistId) },
          { label: "Analytics" },
          { label: "Growth Velocity" },
        ]}
        secondaryActions={
          <div className="flex items-center gap-2 bg-surface border border-border rounded-lg p-1 shadow-sm">
            <div className="flex items-center gap-1.5 px-2 border-r border-border">
              <Clock className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                size="sm"
                aria-label="Select date range"
                className="border-0 shadow-none bg-transparent hover:bg-surface-muted focus:ring-0 text-sm font-medium"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </Select>
            </div>

            <div className="flex items-center px-1">
              <Select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as "hourly" | "daily")}
                size="sm"
                aria-label="Select resolution"
                className="border-0 shadow-none bg-transparent hover:bg-surface-muted focus:ring-0 text-sm font-medium"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
              </Select>
            </div>
          </div>
        }
      />

      {!hasData ? (
        <EmptyState
          title="No growth data yet"
          description="Once visitors start joining your waitlist, you'll see your growth momentum here."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Total Signups"
              value={growth.summary.totalSignups.toLocaleString()}
              icon={<Users className="h-4 w-4" />}
            />
            <MetricCard
              label="Peak Hour"
              value={growth.summary.peakHour ? growth.summary.peakHour.signupCount.toLocaleString() : "—"}
              description={growth.summary.peakHour ? new Date(growth.summary.peakHour.timestamp).toLocaleString() : "No data available"}
              icon={<Clock className="h-4 w-4" />}
            />
            <MetricCard
              label="Referral Spikes"
              value={growth.summary.spikeCount}
              icon={<Flame className="h-4 w-4" />}
            />
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
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                        <Flame className="h-5 w-5 text-destructive" />
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
    </PageContainer>
  );
}
