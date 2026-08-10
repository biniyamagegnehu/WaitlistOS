"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Flame } from "lucide-react";

import { GrowthDataPoint, ReferralSpikeData } from "@/services/analytics";

interface GrowthVelocityChartProps {
  data: GrowthDataPoint[];
  spikes: ReferralSpikeData[];
  viewMode: "hourly" | "daily";
}

export function GrowthVelocityChart({ data, spikes, viewMode }: GrowthVelocityChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        No data available for the selected time range.
      </div>
    );
  }

  // Format data for chart legend
  const chartData = data.map((point) => ({
    ...point,
    formattedTime: formatTime(point.timestamp),
  }));

  // Find spike positions for reference lines
  const spikePositions = spikes.map((spike) => ({
    x: new Date(spike.startAt).getTime(),
    spike,
  }));

  function formatTime(value: any): string {
    const date = new Date(value);
    if (viewMode === "hourly") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  }

  function formatTooltipLabel(label: any): string {
    const date = new Date(label);
    if (viewMode === "hourly") {
      return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  }

  const maxSignupCount = Math.max(...data.map((d) => d.signupCount), 1);

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            className="text-xs text-muted-foreground"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis className="text-xs text-muted-foreground" domain={[0, maxSignupCount * 1.1]} />
          <Tooltip
            labelFormatter={formatTooltipLabel}
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Line
            type="monotone"
            dataKey="signupCount"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", r: 3 }}
            activeDot={{ r: 5 }}
            name="Signups"
          />
          {spikePositions.map(({ x, spike }) => {
            const spikeData = chartData.find(
              (d) => new Date(d.timestamp).getTime() >= x && new Date(d.timestamp).getTime() <= new Date(spike.endAt).getTime()
            );
            if (!spikeData) return null;

            return (
              <ReferenceLine
                key={spike.id}
                x={spikeData.timestamp}
                stroke="hsl(var(--orange-500))"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={
                  <foreignObject x={-20} y={0} width={100} height={40}>
                    <div className="flex items-center gap-1 text-orange-500 text-xs font-medium">
                      <Flame className="h-3 w-3" />
                      <span>Spike</span>
                    </div>
                  </foreignObject>
                }
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
