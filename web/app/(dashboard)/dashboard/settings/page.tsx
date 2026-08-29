"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Shield, Monitor } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoadingState } from "@/components/patterns/loading-state";
import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { ProfileSettingsSection } from "@/components/dashboard/settings/profile-section";
import { SecuritySettingsSection } from "@/components/dashboard/settings/security-section";
import { SessionsSettingsSection } from "@/components/dashboard/settings/sessions-section";
import { routes } from "@/lib/routes";
import type { SettingsTab } from "@/types/dashboard";

import { CreditCard } from "lucide-react";
import { PaymentsSettingsSection } from "@/components/dashboard/settings/payments-section";

const tabs: Array<{ value: SettingsTab; label: string; icon: React.ReactNode }> = [
  { value: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { value: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
  { value: "sessions", label: "Sessions", icon: <Monitor className="h-4 w-4" /> },
  { value: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
];

function isSettingsTab(value: string | null): value is SettingsTab {
  return value === "profile" || value === "security" || value === "sessions" || value === "payments";
}

function SettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: SettingsTab = isSettingsTab(tabParam) ? tabParam : "profile";

  const handleTabChange = (tab: string) => {
    router.replace(routes.settingsTab(tab as SettingsTab), { scroll: false });
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Manage your profile, security, active sessions, and payments"
        />

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full max-w-2xl">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile">
            <ProfileSettingsSection />
          </TabsContent>
          <TabsContent value="security">
            <SecuritySettingsSection />
          </TabsContent>
          <TabsContent value="sessions">
            <SessionsSettingsSection />
          </TabsContent>
          <TabsContent value="payments">
            <PaymentsSettingsSection />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <LoadingState variant="skeleton" skeletonCount={3} />
        </PageContainer>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
