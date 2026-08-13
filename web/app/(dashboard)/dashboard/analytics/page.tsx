"use client";
import { useSearchParams } from "next/navigation";
import { AnalyticsWorkspaceFeature } from "@/components/analytics/AnalyticsWorkspaceFeature";
export default function AnalyticsPage() { const tab=useSearchParams().get("tab"); return <AnalyticsWorkspaceFeature feature={tab === "geo" || tab === "funnel" || tab === "growth" ? tab : "source"}/>; }
