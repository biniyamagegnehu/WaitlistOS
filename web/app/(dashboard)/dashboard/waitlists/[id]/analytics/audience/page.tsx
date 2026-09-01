"use client";

import React, { useEffect, useState, use } from "react";
import { BackButton } from "@/components/navigation/back-button";
import { useRouter } from "next/navigation";
import { MapPin, Smartphone, Globe } from "lucide-react";

import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { LoadingState } from "@/components/patterns/loading-state";
import { ErrorState } from "@/components/patterns/error-state";
import { MetricCard } from "@/components/patterns/metric-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";

import { getAudienceAnalytics, AudienceAnalyticsResponse } from "@/services/analytics";
import { getDashboardWaitlistDetail } from "@/services/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";

import { GeoMap } from "@/components/analytics/GeoMap";
import { CountryTable } from "@/components/analytics/CountryTable";
import { DeviceChart } from "@/components/analytics/DeviceChart";
import { BrowserChart } from "@/components/analytics/BrowserChart";

export default function AudienceAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: waitlistId } = use(params);
  const router = useRouter();

  const [analytics, setAnalytics] = useState<AudienceAnalyticsResponse | null>(null);
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

        const data = await getAudienceAnalytics(waitlistId, fromDate);
        setAnalytics(data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Unable to load audience analytics."));
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

  if (!analytics) return null;

  const hasData = analytics.totalSignups > 0;
  
  const topCountry = analytics.countries.filter(c => c.code !== 'Unknown')[0];
  const topDevice = analytics.devices.filter(d => d.type !== 'UNKNOWN')[0];
  const topBrowser = analytics.browsers.filter(b => b.name !== 'Unknown')[0];

  return (
    <PageContainer>
      <BackButton href={routes.waitlist(waitlistId)} label="Back to waitlist" className="mb-4" />
      <PageHeader
        title="Geo & Device"
        description="Understand where your audience is from and how they access your waitlist."
        breadcrumbs={[
          { label: waitlistName || "Waitlist", href: routes.waitlist(waitlistId) },
          { label: "Analytics" },
          { label: "Geo & Device" },
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
          title="No audience data yet."
          description="Once people start joining your waitlist, their country and device insights will appear here."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              label="Total Signups"
              value={analytics.totalSignups.toLocaleString()}
              description={`${analytics.geoAnalyzedSignups} analyzed for location`}
            />
            <MetricCard
              label="Top Country"
              value={topCountry ? topCountry.name : "Unknown"}
              icon={<MapPin className="h-4 w-4" />}
            />
            <MetricCard
              label="Top Device"
              value={topDevice ? topDevice.label : "Unknown"}
              icon={<Smartphone className="h-4 w-4" />}
            />
            <MetricCard
              label="Top Browser"
              value={topBrowser ? topBrowser.name : "Unknown"}
              icon={<Globe className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Map and Country Table */}
            <Card className="lg:col-span-2 flex flex-col">
              <CardHeader>
                <CardTitle>Signups by Country</CardTitle>
                <CardDescription>Global distribution of your waitlist signups.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-6">
                <div className="w-full bg-muted/20 rounded-md overflow-hidden border">
                  <GeoMap data={analytics.countries} />
                </div>
                <div className="mt-auto">
                  <CountryTable data={analytics.countries} />
                </div>
              </CardContent>
            </Card>

            {/* Devices and Browsers */}
            <div className="flex flex-col gap-6">
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>Devices</CardTitle>
                  <CardDescription>What devices are they using?</CardDescription>
                </CardHeader>
                <CardContent>
                  <DeviceChart data={analytics.devices} />
                </CardContent>
              </Card>

              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>Browsers</CardTitle>
                  <CardDescription>Which browser do they prefer?</CardDescription>
                </CardHeader>
                <CardContent>
                  <BrowserChart data={analytics.browsers} />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}
