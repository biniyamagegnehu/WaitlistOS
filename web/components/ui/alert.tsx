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
  error: <AlertCircle className="h-4 w-4 shrink-0 text-error" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />,
  info: <Info className="h-4 w-4 shrink-0 text-info" />,
};

const variantStyles: Record<AlertVariant, string> = {
  success: "bg-success-muted text-success",
  error: "bg-error-muted text-error",
  warning: "bg-warning-muted text-warning",
  info: "bg-info-muted text-info",
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
        "flex items-start gap-3 px-4 py-3 rounded-md border",
        variantStyles[variant],
        className
      )}
    >
      {icons[variant]}
      <div className="min-w-0 flex-1">
        {title && (
          <p className="mb-1 text-sm font-semibold text-text-primary">{title}</p>
        )}
        <div className="text-sm text-text-primary">{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
