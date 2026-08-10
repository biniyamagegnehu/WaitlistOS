"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Activity, Target, Users } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";

import { getWaitlistAnalytics, AnalyticsResponse } from "@/services/analytics";
import { getDashboardWaitlistDetail } from "@/services/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";

const SOURCE_LABELS: Record<string, string> = {
  DIRECT: "Direct",
  TWITTER: "Twitter/X",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  EMAIL: "Email",
  PRODUCT_HUNT: "Product Hunt",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  GOOGLE: "Google",
  OTHER: "Other",
  UNKNOWN: "Unknown",
};

const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
  "#94a3b8", // slate-400
];

export default function AnalyticsSourcesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: waitlistId } = use(params);

  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
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

        const data = await getWaitlistAnalytics(waitlistId, fromDate);
        setAnalytics(data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Unable to load acquisition analytics."));
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

  if (!analytics) return null;

  const hasData = analytics.totalVisitors > 0 || analytics.totalSignups > 0;
  
  // Format for pie chart (signups distribution)
  const chartData = analytics.sources
    .filter(s => s.signups > 0)
    .map((s, index) => ({
      name: SOURCE_LABELS[s.source] || s.source,
      value: s.signups,
      percentage: ((s.signups / analytics.totalSignups) * 100).toFixed(1),
      color: COLORS[index % COLORS.length]
    }));

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
          title="Acquisition"
          description="See where your waitlist visitors and signups are coming from."
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
          title="No traffic data yet."
          description="Share your waitlist link with your audience and your traffic sources will appear here."
          action={
            <Link href={routes.waitlistShare(waitlistId)}>
              <Button leftIcon={<ExternalLink className="h-4 w-4" />}>Share Waitlist</Button>
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
                  <span className="text-sm font-medium">Visitors</span>
                </div>
                <div className="mt-4 text-3xl font-bold">{analytics.totalVisitors.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span className="text-sm font-medium">Signups</span>
                </div>
                <div className="mt-4 text-3xl font-bold">{analytics.totalSignups.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm font-medium">Conversion Rate</span>
                </div>
                {analytics.totalVisitors === 0 ? (
                  <>
                    <div className="mt-4 text-3xl font-bold text-muted-foreground">—</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Needs visitor tracking data
                    </p>
                  </>
                ) : (
                  <>
                    <div
                      className={`mt-4 text-3xl font-bold ${
                        analytics.overallConversionRate >= 10
                          ? "text-emerald-500"
                          : analytics.overallConversionRate >= 3
                          ? "text-amber-500"
                          : "text-foreground"
                      }`}
                    >
                      {analytics.overallConversionRate}%
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {analytics.totalSignups} of {analytics.totalVisitors} visitors
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-sm font-medium">Top Source</span>
                </div>
                <div className="mt-4 text-xl font-bold truncate">
                  {analytics.sources.length > 0 && analytics.sources[0].signups > 0
                    ? SOURCE_LABELS[analytics.sources[0].source] || analytics.sources[0].source
                    : "-"}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Signup Sources</CardTitle>
                <CardDescription>Distribution of your waitlist signups by source.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                {chartData.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: any, name: any, props: any) => [`${value} (${props.payload.percentage}%)`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                    No signups to display
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Source Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Source</th>
                        <th className="px-4 py-3 font-medium text-right">Visitors</th>
                        <th className="px-4 py-3 font-medium text-right">Signups</th>
                        <th className="px-4 py-3 font-medium text-right">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.sources.map((source) => (
                        <tr key={source.source} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">
                            {SOURCE_LABELS[source.source] || source.source}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {source.visitors.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {source.signups.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {source.visitors === 0 ? (
                              <span className="text-muted-foreground" title="No visit tracking data for this source">—</span>
                            ) : (
                              <span
                                className={
                                  source.conversionRate >= 10
                                    ? "text-emerald-500 font-medium"
                                    : source.conversionRate >= 3
                                    ? "text-amber-500"
                                    : "text-muted-foreground"
                                }
                              >
                                {source.conversionRate}%
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
