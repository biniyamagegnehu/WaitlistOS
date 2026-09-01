"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import * as React from "react";

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  segments?: BreadcrumbSegment[];
  className?: string;
}

// Context for pages to override breadcrumbs
const BreadcrumbContext = React.createContext<{
  segments: BreadcrumbSegment[] | null;
  setSegments: (segments: BreadcrumbSegment[] | null) => void;
}>({
  segments: null,
  setSegments: () => {},
});

export function useSetBreadcrumbs() {
  const context = React.useContext(BreadcrumbContext);
  if (!context) return null;
  return context.setSegments;
}

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [segments, setSegments] = React.useState<BreadcrumbSegment[] | null>(null);

  return (
    <BreadcrumbContext.Provider value={{ segments, setSegments }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function Breadcrumbs({ segments, className }: BreadcrumbsProps) {
  const context = React.useContext(BreadcrumbContext);
  const contextSegments = context?.segments;
  const crumbs = segments ?? contextSegments;

  if (!crumbs || crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm", className)}
    >
      <Link
        href={routes.dashboard}
        className="flex items-center rounded-md text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label="Dashboard home"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span
            key={`${crumb.label}-${crumb.href ?? "current"}`}
            className="flex items-center gap-1"
          >
            <ChevronRight className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
            {isLast || !crumb.href ? (
              <span
                className={cn(
                  isLast ? "font-medium text-text-primary" : "text-text-muted"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="rounded-md text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
