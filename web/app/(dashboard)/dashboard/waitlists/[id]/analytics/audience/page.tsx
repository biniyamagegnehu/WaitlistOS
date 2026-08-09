"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Smartphone, Globe } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";

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

  if (!analytics) return null;

  const hasData = analytics.totalSignups > 0;
  
  const topCountry = analytics.countries.filter(c => c.code !== 'Unknown')[0];
  const topDevice = analytics.devices.filter(d => d.type !== 'UNKNOWN')[0];
  const topBrowser = analytics.browsers.filter(b => b.name !== 'Unknown')[0];

  return (
    <div className="space-y-6 pb-20">
      <Link
        href={routes.waitlist(waitlistId)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {waitlistName || "Waitlist"}
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Geo & Device"
          description="Understand where your audience is from and how they access your waitlist."
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
          title="No audience data yet."
          description="Once people start joining your waitlist, their country and device insights will appear here."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-sm font-medium">Total Signups</span>
                </div>
                <div className="mt-4 text-3xl font-bold">{analytics.totalSignups.toLocaleString()}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {analytics.geoAnalyzedSignups} analyzed for location
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">Top Country</span>
                </div>
                <div className="mt-4 text-2xl font-bold truncate">
                  {topCountry ? topCountry.name : "Unknown"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-sm font-medium">Top Device</span>
                </div>
                <div className="mt-4 text-2xl font-bold truncate">
                  {topDevice ? topDevice.label : "Unknown"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">Top Browser</span>
                </div>
                <div className="mt-4 text-2xl font-bold truncate">
                  {topBrowser ? topBrowser.name : "Unknown"}
                </div>
              </CardContent>
            </Card>
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
    </div>
  );
}
