"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/cn";

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  /** Provide manual segments, or leave undefined to auto-generate from path */
  segments?: BreadcrumbSegment[];
  className?: string;
}

function buildSegments(pathname: string): BreadcrumbSegment[] {
  const normalizedPath = pathname.replace(/^\/dashboard\/dashboard(?=\/|$)/, "/dashboard");
  const parts = normalizedPath.split("/").filter(Boolean);

  const labels: Record<string, string> = {
    dashboard: "Account",
    profile: "Profile",
    security: "Security",
    sessions: "Sessions",
  };

  return parts.map((part, index) => {
    const href = "/" + parts.slice(0, index + 1).join("/");
    const label =
      labels[part] ??
      part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return { label, href };
  });
}

export function Breadcrumbs({ segments, className }: BreadcrumbsProps) {
  const pathname = usePathname();
  const crumbs = segments ?? buildSegments(pathname);

  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm", className)}
    >
      <Link
        href="/"
        className="flex items-center text-zinc-500 hover:text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        aria-label="Home"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.href ?? crumb.label} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600" aria-hidden="true" />
            {isLast || !crumb.href ? (
              <span
                className={cn(
                  isLast ? "text-zinc-200 font-medium" : "text-zinc-500"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-zinc-500 hover:text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
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
