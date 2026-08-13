"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import type { FunnelStep } from "@/services/analytics";

interface FunnelVisualizationProps {
  steps: FunnelStep[];
}

const chartConfig = {
  count: { label: "Users", color: "var(--primary)" },
} satisfies ChartConfig;

const percentage = (value: number | null) => value === null ? "—" : `${Math.max(0, Math.min(100, value)).toFixed(0)}%`;

export function FunnelVisualization({ steps }: FunnelVisualizationProps) {
  const chartData = steps.map((step, index) => ({
    ...step,
    stage: step.label,
    previousStage: index === 0 ? null : steps[index - 1]?.label,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[300px] sm:h-[340px]" aria-label="Conversion funnel chart showing event counts by stage">
      <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 62, bottom: 8, left: 16 }} barCategoryGap="22%">
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" hide />
        <YAxis dataKey="stage" type="category" width={126} tickLine={false} axisLine={false} className="text-xs" />
        <ChartTooltip
          cursor={{ fill: "var(--surface-muted)" }}
          content={({ active, payload }) => {
            const item = payload?.[0]?.payload as (typeof chartData)[number] | undefined;
            if (!active || !item) return null;
            const startingPoint = !item.previousStage;
            return (
              <div className="min-w-56 rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-md">
                <p className="font-medium text-foreground">{item.stage}</p>
                <p className="mt-1 flex justify-between gap-6 text-muted-foreground"><span>Users</span><span className="font-medium text-foreground">{item.count.toLocaleString()}</span></p>
                <p className="mt-1 text-muted-foreground">Conversion{startingPoint ? ": Starting point" : ` from ${item.previousStage}: ${percentage(item.conversionRate)}`}</p>
                <p className="text-muted-foreground">Drop-off{startingPoint ? ": N/A" : ` from ${item.previousStage}: ${percentage(item.dropOffRate)}`}</p>
              </div>
            );
          }}
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]}>
          <LabelList dataKey="count" position="right" formatter={(value) => Number(value).toLocaleString()} className="fill-foreground text-xs font-medium" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
