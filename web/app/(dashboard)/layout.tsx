"use client";

import * as React from "react";
import { DashboardSidebar } from "@/components/navigation/sidebar";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { MobileMenu } from "@/components/navigation/mobile-menu";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d14] text-white">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0">
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />
      </div>

      {/* Mobile menu drawer */}
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Content area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DashboardHeader onMobileMenuToggle={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
