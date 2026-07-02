"use client";

import * as React from "react";
import { Menu, Plus, Bell } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

interface DashboardHeaderProps {
  onMobileMenuToggle: () => void;
}

export function DashboardHeader({ onMobileMenuToggle }: DashboardHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-white/8 bg-[#0a0a11]/80 backdrop-blur-xl px-4 sm:px-6">
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuToggle}
        aria-label="Open navigation"
        className="inline-flex lg:hidden items-center justify-center rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumbs */}
      <div className="flex-1 min-w-0">
        <Breadcrumbs />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notifications placeholder */}
        <button
          aria-label="Notifications"
          className="inline-flex items-center justify-center rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Create waitlist CTA */}
        <Link
          href="/create"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a11]"
        >
          <Plus className="h-3.5 w-3.5" />
          New Waitlist
        </Link>
      </div>
    </header>
  );
}
