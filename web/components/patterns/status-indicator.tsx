import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";

export type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "completed"
  | "failed"
  | "draft"
  | "published"
  | "connected"
  | "disconnected"
  | "waiting"
  | "invited"
  | "accessed";

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { variant: "success" | "warning" | "danger" | "info" | "default" | "outline" | "accent"; defaultLabel: string }
> = {
  active: { variant: "success", defaultLabel: "Active" },
  inactive: { variant: "outline", defaultLabel: "Inactive" },
  pending: { variant: "warning", defaultLabel: "Pending" },
  completed: { variant: "success", defaultLabel: "Completed" },
  failed: { variant: "danger", defaultLabel: "Failed" },
  draft: { variant: "default", defaultLabel: "Draft" },
  published: { variant: "success", defaultLabel: "Published" },
  connected: { variant: "success", defaultLabel: "Connected" },
  disconnected: { variant: "danger", defaultLabel: "Disconnected" },
  waiting: { variant: "outline", defaultLabel: "Waiting" },
  invited: { variant: "info", defaultLabel: "Invited" },
  accessed: { variant: "success", defaultLabel: "Accessed" },
};

export function StatusIndicator({
  status,
  label,
  size = "sm",
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status] || statusConfig.inactive;
  const displayLabel = label || config.defaultLabel;

  return (
    <Badge variant={config.variant} size={size} className={className}>
      {displayLabel}
    </Badge>
  );
}
