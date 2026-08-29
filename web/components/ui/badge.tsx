import * as React from "react";
import { cn } from "@/lib/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "accent" | "outline";
  size?: "sm" | "md";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-surface-muted text-text-primary rounded-md",
  success: "bg-success-muted text-success rounded-md",
  warning: "bg-warning-muted text-warning rounded-md",
  danger: "bg-error-muted text-error rounded-md",
  info: "bg-info-muted text-info rounded-md",
  accent: "bg-accent/15 text-accent rounded-md",
  outline: "bg-transparent text-text-muted border border-border rounded-md",
};

const sizeClasses: Record<NonNullable<BadgeProps["size"]>, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({
  className,
  variant = "default",
  size = "md",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium leading-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
