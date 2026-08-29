import * as React from "react";
import { cn } from "@/lib/cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label?: string;
  };
  icon?: React.ReactNode;
  status?: "success" | "warning" | "error" | "neutral";
  className?: string;
}

export function MetricCard({
  label,
  value,
  description,
  trend,
  icon,
  status = "neutral",
  className,
}: MetricCardProps) {
  const trendIcon = trend && trend.value > 0 ? (
    <TrendingUp className="h-4 w-4" />
  ) : trend && trend.value < 0 ? (
    <TrendingDown className="h-4 w-4" />
  ) : (
    <Minus className="h-4 w-4" />
  );

  const trendColor = trend && trend.value > 0
    ? "text-success"
    : trend && trend.value < 0
    ? "text-error"
    : "text-text-muted";

  const statusBadge = status !== "neutral" && (
    <Badge
      variant={status === "success" ? "success" : status === "warning" ? "warning" : "danger"}
      size="sm"
    >
      {status}
    </Badge>
  );

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-text-muted">{label}</CardTitle>
        {icon && <div className="text-text-muted">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-semibold text-text-primary">{value}</div>
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
              {trendIcon}
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && <span className="text-text-muted"> {trend.label}</span>}
            </div>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs text-text-muted">{description}</p>
        )}
        {statusBadge && <div className="mt-2">{statusBadge}</div>}
      </CardContent>
    </Card>
  );
}
