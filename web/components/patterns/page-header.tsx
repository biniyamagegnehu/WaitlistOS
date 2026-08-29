import * as React from "react";
import { cn } from "@/lib/cn";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  leadingIcon?: React.ReactNode;
  metadata?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  leadingIcon,
  metadata,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {breadcrumbs && <Breadcrumbs segments={breadcrumbs} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            {leadingIcon && (
              <div className="flex shrink-0 items-center justify-center">
                {leadingIcon}
              </div>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              {title}
            </h1>
          </div>
          {description && (
            <p className="text-sm text-text-muted sm:text-base">{description}</p>
          )}
          {metadata && <div className="mt-2">{metadata}</div>}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          {secondaryActions && (
            <div className="flex flex-wrap gap-2">{secondaryActions}</div>
          )}
          {primaryAction && <div className="flex shrink-0">{primaryAction}</div>}
        </div>
      </div>
    </div>
  );
}
