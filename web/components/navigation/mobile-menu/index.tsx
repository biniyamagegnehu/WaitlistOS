"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LayoutDashboard, List, Settings, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import { LogoutButton } from "@/components/auth/logout-button";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

const links = [
  { label: "Overview", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Waitlists", href: "/dashboard/waitlists", icon: <List className="h-4 w-4" /> },
  { label: "Settings", href: "/dashboard/settings", icon: <Settings className="h-4 w-4" /> },
];

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  // Close on route change
  React.useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape key
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#0a0a11] border-r border-white/10 shadow-2xl"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/8 px-4 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-[14px] tracking-tight">WaitlistOS</span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {links.map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  isActive
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-600/30"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent"
                )}
              >
                <span className="shrink-0">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/8 p-3 shrink-0">
          <LogoutButton
            onLogout={onClose}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-red-400 transition-all disabled:cursor-wait disabled:opacity-70"
          />
        </div>
      </div>
    </>
  );
}
