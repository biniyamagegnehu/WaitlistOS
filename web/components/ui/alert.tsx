"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

export type AlertVariant = "success" | "error" | "warning" | "info";

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const icons: Record<AlertVariant, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 shrink-0 text-success" />,
  error: <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />,
  info: <Info className="h-4 w-4 shrink-0 text-info" />,
};

const variantStyles: Record<AlertVariant, string> = {
  success: "border-success/25 bg-success/5",
  error: "border-destructive/25 bg-destructive/5",
  warning: "border-warning/25 bg-warning/5",
  info: "border-info/25 bg-info/5",
};

export function Alert({
  variant = "info",
  title,
  children,
  dismissible = false,
  onDismiss,
  className,
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-md border px-4 py-3",
        variantStyles[variant],
        className
      )}
    >
      {icons[variant]}
      <div className="min-w-0 flex-1">
        {title && (
          <p className="mb-1 text-sm font-semibold text-foreground">{title}</p>
        )}
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
