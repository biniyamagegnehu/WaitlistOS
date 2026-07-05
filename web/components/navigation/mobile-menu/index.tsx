"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { BrandLogo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/features/auth/logout-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { routes } from "@/lib/routes";
import {
  dashboardNavLinks,
  isDashboardNavActive,
} from "@/components/navigation/dashboard-nav";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  React.useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-foreground/20"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface shadow-md"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <BrandLogo href={routes.dashboard} />
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {dashboardNavLinks.map((link) => {
            const isActive = isDashboardNavActive(pathname, link.href);

            return (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                )}
              >
                <span className="shrink-0">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-divider p-3">
          <div className="flex items-center justify-between rounded-md px-3 py-2">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle size="sm" />
          </div>
          <LogoutButton
            onLogout={onClose}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive disabled:cursor-wait disabled:opacity-70"
          />
        </div>
      </div>
    </>
  );
}
