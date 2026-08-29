import * as React from "react";
import { cn } from "@/lib/cn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  onHome?: () => void;
  variant?: "page" | "inline" | "card";
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "An error occurred while loading this content. Please try again.",
  onRetry,
  onHome,
  variant = "page",
  className,
}: ErrorStateProps) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center text-center", className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-muted">
        <AlertCircle className="h-8 w-8 text-error" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-text-muted">{description}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        {onHome && (
          <Button variant="outline" onClick={onHome}>
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        )}
      </div>
    </div>
  );

  if (variant === "card") {
    return (
      <Card>
        <CardContent className="py-12">{content}</CardContent>
      </Card>
    );
  }

  if (variant === "inline") {
    return <div className={cn("py-8", className)}>{content}</div>;
  }

  return <div className={cn("min-h-[400px] py-12", className)}>{content}</div>;
}
