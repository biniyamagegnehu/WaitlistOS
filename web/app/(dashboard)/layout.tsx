"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/navigation/sidebar";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { MobileMenu } from "@/components/navigation/mobile-menu";
import { useAuth } from "@/contexts/auth-context";
import { routes } from "@/lib/routes";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(routes.login);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d14] text-white">
        Loading...
      </div>
    );
  }

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
