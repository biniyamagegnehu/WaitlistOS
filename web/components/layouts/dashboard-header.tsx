"use client";

import * as React from "react";
import { Menu, Plus, Bell } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { UserMenu } from "@/components/navigation/user-menu";
import { routes } from "@/lib/routes";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/cn";

interface DashboardHeaderProps {
  onMobileMenuToggle: () => void;
}

export function DashboardHeader({ onMobileMenuToggle }: DashboardHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 bg-surface px-4 sm:px-6">
      <button
        onClick={onMobileMenuToggle}
        aria-label="Open navigation"
        className="inline-flex items-center justify-center p-2 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle size="sm" />

        <button
          aria-label="Notifications"
          className="inline-flex items-center justify-center p-2 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none"
        >
          <Bell className="h-4 w-4" />
        </button>

        <Link
          href={routes.create}
          className={cn(
            "hidden sm:inline-flex h-8 items-center gap-1.5 bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover",
            "focus-visible:outline-none"
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          New Waitlist
        </Link>

        <UserMenu />
      </div>
    </header>
  );
}
