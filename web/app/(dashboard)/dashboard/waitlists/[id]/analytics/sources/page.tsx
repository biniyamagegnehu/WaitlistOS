"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Activity, Target, Users } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { LoadingState } from "@/components/patterns/loading-state";
import { ErrorState } from "@/components/patterns/error-state";
import { MetricCard } from "@/components/patterns/metric-card";
import { DataTable, type Column } from "@/components/patterns/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";

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

// Data visualization colors - intentionally hardcoded for consistent chart rendering
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
  const router = useRouter();

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
    <PageContainer>
      <PageHeader
        title="Acquisition"
        description="See where your waitlist visitors and signups are coming from."
        breadcrumbs={[
          { label: waitlistName || "Waitlist", href: routes.waitlist(waitlistId) },
          { label: "Analytics" },
          { label: "Acquisition" },
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
          title="No traffic data yet."
          description="Share your waitlist link with your audience and your traffic sources will appear here."
          action={
            <Button onClick={() => router.push(routes.waitlistShare(waitlistId))} leftIcon={<ExternalLink className="h-4 w-4" />}>Share Waitlist</Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              label="Visitors"
              value={analytics.totalVisitors.toLocaleString()}
              icon={<Users className="h-4 w-4" />}
            />
            <MetricCard
              label="Signups"
              value={analytics.totalSignups.toLocaleString()}
              icon={<Target className="h-4 w-4" />}
            />
            <MetricCard
              label="Conversion Rate"
              value={analytics.totalVisitors === 0 ? "—" : `${analytics.overallConversionRate}%`}
              description={analytics.totalVisitors === 0 ? "Needs visitor tracking data" : `${analytics.totalSignups} of ${analytics.totalVisitors} visitors`}
              icon={<Activity className="h-4 w-4" />}
              status={analytics.totalVisitors > 0 && analytics.overallConversionRate >= 10 ? "success" : analytics.totalVisitors > 0 && analytics.overallConversionRate >= 3 ? "warning" : "neutral"}
            />
            <MetricCard
              label="Top Source"
              value={analytics.sources.length > 0 && analytics.sources[0].signups > 0
                ? SOURCE_LABELS[analytics.sources[0].source] || analytics.sources[0].source
                : "-"}
            />
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
                      <PieChart aria-label="Pie chart showing signup distribution by source">
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
                <CardDescription>Conversion rates and performance by traffic source.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={analytics.sources}
                  columns={[
                    {
                      key: "source",
                      header: "Source",
                      render: (row) => SOURCE_LABELS[row.source] || row.source,
                    },
                    {
                      key: "visitors",
                      header: "Visitors",
                      render: (row) => row.visitors.toLocaleString(),
                      className: "text-right",
                    },
                    {
                      key: "signups",
                      header: "Signups",
                      render: (row) => row.signups.toLocaleString(),
                      className: "text-right font-medium",
                    },
                    {
                      key: "conversionRate",
                      header: "Conversion",
                      render: (row) =>
                        row.visitors === 0 ? (
                          <span className="text-muted-foreground" title="No visit tracking data for this source">—</span>
                        ) : (
                          <span
                            className={
                              row.conversionRate >= 10
                                ? "text-success font-medium"
                                : row.conversionRate >= 3
                                ? "text-warning"
                                : "text-muted-foreground"
                            }
                          >
                            {row.conversionRate}%
                          </span>
                        ),
                      className: "text-right",
                    },
                  ]}
                  rowKey={(row) => row.source}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </PageContainer>
  );
}
