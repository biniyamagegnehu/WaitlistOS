"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, Package, Network } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { SkipLineSection } from "@/components/dashboard/monetization/skip-line-section";
import { PreOrderSection } from "@/components/dashboard/monetization/pre-order-section";
import { AffiliateSection } from "@/components/dashboard/monetization/affiliate-section";

type MonetizationTab = "skip-line" | "pre-order" | "affiliate";

const tabs: Array<{ value: MonetizationTab; label: string; icon: React.ReactNode }> = [
  { value: "skip-line", label: "Skip the Line", icon: <Zap className="h-4 w-4" /> },
  { value: "pre-order", label: "Pre-Order", icon: <Package className="h-4 w-4" /> },
  { value: "affiliate", label: "Affiliate Program", icon: <Network className="h-4 w-4" /> },
];

function isMonetizationTab(value: string | null): value is MonetizationTab {
  return value === "skip-line" || value === "pre-order" || value === "affiliate";
}

function MonetizationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: MonetizationTab = isMonetizationTab(tabParam) ? tabParam : "skip-line";

  const handleTabChange = (tab: string) => {
    router.replace(routes.monetizationTab(tab as MonetizationTab), { scroll: false });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Monetization"
        description="Manage all your revenue streams — Skip the Line, Pre-Order deposits, and Affiliate earnings"
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

        <TabsContent value="skip-line">
          <SkipLineSection />
        </TabsContent>

        <TabsContent value="pre-order">
          <PreOrderSection />
        </TabsContent>

        <TabsContent value="affiliate">
          <AffiliateSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function MonetizationPage() {
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
      <MonetizationPageContent />
    </Suspense>
  );
}
