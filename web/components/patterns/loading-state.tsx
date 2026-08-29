import * as React from "react";
import { cn } from "@/lib/cn";
import { PageLoader } from "@/components/ui/loader";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  message?: string;
  variant?: "page" | "inline" | "skeleton";
  skeletonCount?: number;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  variant = "page",
  skeletonCount = 3,
  className,
}: LoadingStateProps) {
  if (variant === "page") {
    return <PageLoader label={message} />;
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <PageLoader label={message} />
      </div>
    );
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return null;
}
