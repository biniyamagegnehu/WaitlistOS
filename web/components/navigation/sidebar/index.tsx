"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  List,
  Settings,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const links: SidebarLink[] = [
  { label: "Overview", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Waitlists", href: "/dashboard/waitlists", icon: <List className="h-4 w-4" /> },
  { label: "Settings", href: "/dashboard/settings", icon: <Settings className="h-4 w-4" /> },
];

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
        "flex flex-col h-full bg-[#0a0a11] border-r border-white/8 transition-all duration-300",
        collapsed ? "w-[64px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/8 px-4 shrink-0">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2.5 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg overflow-hidden",
            collapsed && "justify-center w-full"
          )}
        >
          <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/40">
            <Zap className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-[14px] tracking-tight whitespace-nowrap">
              WaitlistOS
            </span>
          )}
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const isActive =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                isActive
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-600/30"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent",
                collapsed && "justify-center px-0"
              )}
            >
              <span className="shrink-0">{link.icon}</span>
              {!collapsed && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button + Logout */}
      <div className="border-t border-white/8 p-2 space-y-0.5 shrink-0">
        {/* Logout */}
        <Link
          href="/api/auth/logout"
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-red-400 transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Link>

        {/* Collapse toggle (hidden on mobile — handled by sheet) */}
        {onCollapse && (
          <button
            onClick={() => onCollapse(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
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
