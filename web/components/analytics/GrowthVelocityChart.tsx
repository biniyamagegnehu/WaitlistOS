"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceDot, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { GrowthDataPoint, ReferralSpikeData } from "@/services/analytics";

interface GrowthVelocityChartProps {
  data: GrowthDataPoint[];
  spikes: ReferralSpikeData[];
  viewMode: "hourly" | "daily";
}

const chartConfig = {
  signups: {
    label: "Signups",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

function formatTimestamp(timestamp: string, viewMode: "hourly" | "daily", compact = false) {
  const date = new Date(timestamp);
  return viewMode === "hourly"
    ? date.toLocaleString([], compact
      ? { hour: "numeric" }
      : { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString([], compact
      ? { month: "short", day: "numeric" }
      : { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function GrowthVelocityChart({ data, spikes, viewMode }: GrowthVelocityChartProps) {
  if (data.length === 0) {
    return <div className="flex h-80 items-center justify-center text-muted-foreground">No data available for the selected time range.</div>;
  }

  const spikeTimestamps = new Set(
    spikes.map((spike) => new Date(spike.startAt).toISOString()),
  );
  const chartData = data.map((point) => ({
    ...point,
    signups: point.signupCount,
    isSpike: spikeTimestamps.has(new Date(point.timestamp).toISOString()),
  }));
  const total = data.reduce((sum, point) => sum + point.signupCount, 0);
  const midpoint = Math.ceil(data.length / 2);
  const previous = data.slice(0, midpoint).reduce((sum, point) => sum + point.signupCount, 0);
  const recent = data.slice(midpoint).reduce((sum, point) => sum + point.signupCount, 0);
  const trendPercent = previous === 0 ? null : Math.round(((recent - previous) / previous) * 100);
  const isUpward = trendPercent !== null && trendPercent >= 0;

  return (
    <div>
      <ChartContainer config={chartConfig} className="h-[340px]">
        <LineChart accessibilityLayer data={chartData} margin={{ top: 18, right: 12, left: -12, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            tickFormatter={(value) => formatTimestamp(value, viewMode, true)}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} width={36} />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent labelFormatter={(value) => formatTimestamp(String(value), viewMode)} />}
          />
          <Line
            dataKey="signups"
            type="natural"
            stroke="var(--color-signups)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "var(--color-signups)" }}
          />
          {chartData.filter((point) => point.isSpike).map((point) => (
            <ReferenceDot
              key={point.timestamp}
              x={point.timestamp}
              y={point.signups}
              r={5}
              fill="#f97316"
              stroke="var(--surface)"
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ChartContainer>
      <div className="mt-4 flex flex-col gap-1 text-sm">
        <div className="flex items-center gap-2 font-medium text-foreground">
          {trendPercent === null ? (
            <>Recorded {total.toLocaleString()} signup{total === 1 ? "" : "s"} in this period</>
          ) : (
            <>
              {isUpward ? "Growth is up" : "Growth is down"} {Math.abs(trendPercent)}% in the most recent half
              {isUpward ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
            </>
          )}
        </div>
        <p className="text-muted-foreground">
          {viewMode === "hourly" ? "Signups per hour" : "Signups per day"}. Orange points mark referral spikes.
        </p>
      </div>
    </div>
  );
}
