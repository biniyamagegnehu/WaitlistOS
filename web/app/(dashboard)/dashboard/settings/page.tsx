"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Shield, Monitor } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileSettingsSection } from "@/components/dashboard/settings/profile-section";
import { SecuritySettingsSection } from "@/components/dashboard/settings/security-section";
import { SessionsSettingsSection } from "@/components/dashboard/settings/sessions-section";
import { routes } from "@/lib/routes";
import type { SettingsTab } from "@/types/dashboard";

const tabs: Array<{ value: SettingsTab; label: string; icon: React.ReactNode }> = [
  { value: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { value: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
  { value: "sessions", label: "Sessions", icon: <Monitor className="h-4 w-4" /> },
];

function isSettingsTab(value: string | null): value is SettingsTab {
  return value === "profile" || value === "security" || value === "sessions";
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
    <div className="space-y-6">
      <SectionHeader
        title="Settings"
        description="Manage your profile, security, and active sessions"
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full max-w-xl">
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
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton variant="rectangular" className="h-10 w-48" />
          <Skeleton variant="rectangular" className="h-12 w-full max-w-xl" />
          <Skeleton variant="rectangular" className="h-64" />
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
