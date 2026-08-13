"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BarChart3, Globe2, GitBranch, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

const items = [
  { label: "Source Attribution", href: routes.analyticsSourceAttribution, icon: BarChart3 },
  { label: "Geo & Device", href: routes.analyticsGeoDevice, icon: Globe2 },
  { label: "Conversion Funnel", href: routes.analyticsConversionFunnel, icon: GitBranch },
  { label: "Growth Velocity", href: routes.analyticsGrowthVelocity, icon: TrendingUp },
];

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "source";
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold">Analytics</h1><p className="mt-1 text-sm text-muted-foreground">Understand performance across all your waitlists or one selected waitlist.</p></div><nav aria-label="Analytics navigation" className="flex gap-1 overflow-x-auto border-b border-border pb-2">{items.map(({ label, href, icon: Icon }) => { const tab = new URLSearchParams(href.split("?")[1]).get("tab") ?? "source"; const params = new URLSearchParams(searchParams.toString()); params.set("tab", tab); return <Link key={href} href={`${pathname}?${params.toString()}`} className={cn("inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium", activeTab === tab ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground")}><Icon className="h-4 w-4" />{label}</Link>; })}</nav>{children}</div>;
}
