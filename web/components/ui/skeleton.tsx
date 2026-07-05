"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({
  variant = "rectangular",
  className,
  ...props
}: SkeletonProps) {
  const variantClasses: Record<NonNullable<typeof variant>, string> = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-md",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-surface-muted",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
