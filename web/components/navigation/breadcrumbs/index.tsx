"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  segments?: BreadcrumbSegment[];
  className?: string;
}

function buildSegments(pathname: string): BreadcrumbSegment[] {
  const normalizedPath = pathname.replace(
    /^\/dashboard\/dashboard(?=\/|$)/,
    "/dashboard"
  );
  const parts = normalizedPath.split("/").filter(Boolean);

  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    waitlists: "Waitlists",
    settings: "Settings",
    profile: "Settings",
    security: "Settings",
    sessions: "Settings",
    create: "Create",
  };

  const crumbs: BreadcrumbSegment[] = [];

  parts.forEach((part, index) => {
    if (part === "dashboard" && index === 0) return;

    const href = "/" + parts.slice(0, index + 1).join("/");

    if (part === "profile" || part === "security" || part === "sessions") {
      if (!crumbs.some((crumb) => crumb.label === "Settings")) {
        crumbs.push({ label: "Settings", href: routes.settings });
      }
      return;
    }

    if (labels[part]) {
      crumbs.push({ label: labels[part], href: index < parts.length - 1 ? href : undefined });
      return;
    }

    if (parts[index - 1] === "waitlists") {
      crumbs.push({ label: "Participants" });
      return;
    }

    crumbs.push({
      label: part.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      href: index < parts.length - 1 ? href : undefined,
    });
  });

  return crumbs;
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
        href={routes.dashboard}
        className="flex items-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {isLast || !crumb.href ? (
              <span
                className={cn(
                  isLast ? "font-medium text-foreground" : "text-muted-foreground"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
