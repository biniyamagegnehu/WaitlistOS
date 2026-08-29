import * as React from "react";
import { cn } from "@/lib/cn";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface FormSectionProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "muted" | "none";
  className?: string;
}

export function FormSection({
  title,
  description,
  action,
  children,
  variant = "default",
  className,
}: FormSectionProps) {
  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="text-sm text-text-muted">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0">{action}</div>}
    </div>
  );

  if (variant === "none") {
    return (
      <div className={cn("space-y-6", className)}>
        {header}
        <div className="space-y-6">{children}</div>
      </div>
    );
  }

  return (
    <Card
      variant={variant === "muted" ? "muted" : "default"}
      className={className}
    >
      <CardHeader>{header}</CardHeader>
      <CardContent>
        <div className="space-y-6">{children}</div>
      </CardContent>
    </Card>
  );
}
