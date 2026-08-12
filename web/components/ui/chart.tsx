"use client";

import * as React from "react";
import { Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/cn";

export type ChartConfig = Record<string, { label?: React.ReactNode; color?: string }>;

const ChartContext = React.createContext<ChartConfig | null>(null);

export function ChartContainer({
  config,
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement> & { config: ChartConfig }) {
  const style = Object.fromEntries(
    Object.entries(config)
      .filter(([, value]) => value.color)
      .map(([key, value]) => [`--color-${key}`, value.color]),
  ) as React.CSSProperties;

  return (
    <ChartContext.Provider value={config}>
      <div className={cn("h-[320px] w-full", className)} style={style}>
        <ResponsiveContainer>{children as React.ReactElement}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = Tooltip;

type ChartTooltipPayload = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
};

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  hideLabel = false,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string | number;
  hideLabel?: boolean;
  labelFormatter?: (label: string | number) => React.ReactNode;
}) {
  const config = React.useContext(ChartContext);

  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-36 rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-md">
      {!hideLabel && label !== undefined && (
        <p className="mb-1 font-medium text-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      {payload.map((item: ChartTooltipPayload) => {
        const key = String(item.dataKey);
        const itemLabel = config?.[key]?.label ?? item.name ?? key;
        return (
          <div key={key} className="flex items-center justify-between gap-4 text-muted-foreground">
            <span>{itemLabel}</span>
            <span className="font-medium text-foreground">{Number(item.value ?? 0).toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}
