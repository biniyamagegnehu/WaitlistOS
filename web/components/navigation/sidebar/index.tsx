"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { BrandLogo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/features/auth/logout-button";
import { routes } from "@/lib/routes";
import {
  dashboardNavLinks,
  isDashboardNavActive,
} from "@/components/navigation/dashboard-nav";

interface DashboardSidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export function DashboardSidebar({
  collapsed = false,
  onCollapse,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Dashboard sidebar"
      className={cn(
        "flex h-full flex-col border-r border-border bg-surface transition-all duration-300",
        collapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      <div className="flex h-16 shrink-0 items-center border-b border-border px-4">
        <BrandLogo
          href="/"
          showText={!collapsed}
          className={cn(collapsed && "justify-center w-full")}
        />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
        {dashboardNavLinks.map((link) => {
          const isActive = isDashboardNavActive(pathname, link.href);

          return (
            <Link
              key={`${link.label}-${link.href}`}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <span className="shrink-0">{link.icon}</span>
              {!collapsed && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-0.5 border-t border-border p-2">
        <LogoutButton
          collapsed={collapsed}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive disabled:cursor-wait disabled:opacity-70",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            collapsed && "justify-center px-0"
          )}
        />

        {onCollapse && (
          <button
            onClick={() => onCollapse(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
