"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Activity, Globe, MapPin, Share2, Smartphone, Target, TrendingUp, Users } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AnalyticsWaitlistFilter } from "./AnalyticsWaitlistFilter";
import { GeoMap } from "./GeoMap";
import { DeviceChart } from "./DeviceChart";
import { BrowserChart } from "./BrowserChart";
import { FunnelVisualization } from "./FunnelVisualization";
import { GrowthVelocityChart } from "./GrowthVelocityChart";
import { CountryTable } from "./CountryTable";
import { getWorkspaceAudienceAnalytics, getWorkspaceConversionFunnel, getWorkspaceGrowthVelocity, getWorkspaceSourceAnalytics, type FunnelStep } from "@/services/analytics";

type Feature = "source" | "geo" | "funnel" | "growth";
type Period = "7d" | "30d" | "90d" | "all";

const heading: Record<Feature, string> = { source: "Source Attribution", geo: "Geo & Device", funnel: "Conversion Funnel", growth: "Growth Velocity" };
const periodLabels: Record<Period, string> = { "7d": "Last 7 Days", "30d": "Last 30 Days", "90d": "Last 90 Days", all: "All Time" };

function periodStart(period: Period) {
  if (period === "all") return undefined;
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const start = new Date();
  start.setDate(start.getDate() - days);
  return start.toISOString();
}

export function AnalyticsWorkspaceFeature({ feature }: { feature: Feature }) {
  const searchParams = useSearchParams();
  const waitlistId = searchParams.get("waitlistId") ?? undefined;
  const period = (searchParams.get("period") as Period | null) ?? "30d";
  const selectedPeriod: Period = period in periodLabels ? period : "30d";
  const [data, setData] = React.useState<any>(null);
  const [loadedFeature, setLoadedFeature] = React.useState<Feature | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [mode, setMode] = React.useState<"hourly" | "daily">("daily");
  const [reload, setReload] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setData(null);
    setLoadedFeature(null);
    const from = feature === "funnel" ? periodStart(selectedPeriod) : undefined;
    const request = feature === "source" ? getWorkspaceSourceAnalytics(waitlistId) : feature === "geo" ? getWorkspaceAudienceAnalytics(waitlistId) : feature === "funnel" ? getWorkspaceConversionFunnel(waitlistId, from) : getWorkspaceGrowthVelocity(waitlistId);

    request
      .then((result) => { if (active) { setData(result); setLoadedFeature(feature); } })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [feature, waitlistId, selectedPeriod, reload]);

  const isReady = !loading && !!data && loadedFeature === feature;
  const description = feature === "funnel" ? "See where visitors drop off before signing up and sharing." : waitlistId ? "Insights for the selected waitlist." : "Aggregated insights across all your waitlists.";

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-xl font-semibold">{heading[feature]}</h2><p className="text-sm text-muted-foreground">{description}</p></div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><AnalyticsWaitlistFilter />{feature === "funnel" && <AnalyticsPeriodFilter period={selectedPeriod} />}</div>
      </div>
      {!isReady && !error ? <AnalyticsSkeleton /> : error ? <EmptyState title={feature === "funnel" ? "Unable to load funnel analytics" : "Unable to load analytics"} description="Please try again." action={<button type="button" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" onClick={() => setReload((value) => value + 1)}>Retry</button>} /> : feature === "source" ? <Source data={data} /> : feature === "geo" ? <Geo data={data} /> : feature === "funnel" ? <Funnel data={data} /> : <Growth data={data} mode={mode} setMode={setMode} />}
    </section>
  );
}

function AnalyticsPeriodFilter({ period }: { period: Period }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const update = (value: Period) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "30d") params.delete("period"); else params.set("period", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  return <label className="flex flex-col gap-1 text-sm font-medium sm:flex-row sm:items-center"><span>Period</span><select aria-label="Select analytics period" value={period} onChange={(event) => update(event.target.value as Period)} className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal">{Object.entries(periodLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>;
}

function AnalyticsSkeleton() { return <div className="space-y-6" aria-label="Loading analytics"><div className="grid gap-4 md:grid-cols-2"><div className="h-36 animate-pulse rounded-xl bg-surface-muted"/><div className="h-36 animate-pulse rounded-xl bg-surface-muted"/></div><div className="h-80 animate-pulse rounded-xl bg-surface-muted"/><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div className="h-32 animate-pulse rounded-xl bg-surface-muted" key={index}/>)}</div></div>; }
function Metric({ icon: Icon, label, value, note }: any) { return <Card><CardContent className="p-6"><div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4"/><span className="text-sm font-medium">{label}</span></div><div className="mt-4 text-3xl font-bold">{value}</div>{note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}</CardContent></Card>; }
const number = (value: unknown) => Number(value ?? 0).toLocaleString();
const safePercent = (numerator: number, denominator: number) => denominator > 0 ? `${Math.max(0, Math.min(100, (numerator / denominator) * 100)).toFixed(0)}%` : "—";

function Source({ data }: { data: any }) { const sources = Array.isArray(data?.sources) ? data.sources : []; const rows = sources.filter((s: any) => s.signups > 0); const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]; return <><div className="grid gap-4 md:grid-cols-4"><Metric icon={Users} label="Visitors" value={number(data?.totalVisitors)}/><Metric icon={Target} label="Signups" value={number(data?.totalSignups)}/><Metric icon={Activity} label="Conversion Rate" value={`${data?.overallConversionRate ?? 0}%`}/><Metric icon={TrendingUp} label="Top Source" value={sources[0]?.source ?? "—"}/></div><div className="grid gap-6 md:grid-cols-3"><Card><CardHeader><CardTitle>Signup Sources</CardTitle></CardHeader><CardContent><div className="h-64"><ResponsiveContainer><PieChart><Pie data={rows} dataKey="signups" nameKey="source" innerRadius={55} outerRadius={80}>{rows.map((_: any, i: number) => <Cell key={i} fill={colors[i % colors.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></CardContent></Card><Card className="md:col-span-2"><CardHeader><CardTitle>Source Performance</CardTitle></CardHeader><CardContent><div className="space-y-2">{sources.map((s: any) => <div className="flex justify-between border-b border-border pb-2 text-sm" key={s.source}><span className="font-medium">{s.source}</span><span>{s.visitors} visitors · {s.signups} signups · {s.conversionRate}%</span></div>)}</div></CardContent></Card></div></>; }
function Geo({ data }: { data: any }) { const countries = Array.isArray(data?.countries) ? data.countries : []; const devices = Array.isArray(data?.devices) ? data.devices : []; const browsers = Array.isArray(data?.browsers) ? data.browsers : []; const country = countries.find((c: any) => c.code !== "Unknown"); return <><div className="grid gap-4 md:grid-cols-4"><Metric icon={Users} label="Total Signups" value={number(data?.totalSignups)} note={`${number(data?.geoAnalyzedSignups)} analyzed for location`}/><Metric icon={MapPin} label="Top Country" value={country?.name ?? "Unknown"}/><Metric icon={Smartphone} label="Top Device" value={devices.find((d: any) => d.type !== "UNKNOWN")?.label ?? "Unknown"}/><Metric icon={Globe} label="Top Browser" value={browsers.find((b: any) => b.name !== "Unknown")?.name ?? "Unknown"}/></div><div className="grid gap-6 lg:grid-cols-3"><Card className="lg:col-span-2"><CardHeader><CardTitle>Signups by Country</CardTitle></CardHeader><CardContent className="space-y-6"><GeoMap data={countries}/><CountryTable data={countries}/></CardContent></Card><div className="space-y-6"><Card><CardHeader><CardTitle>Devices</CardTitle></CardHeader><CardContent><DeviceChart data={devices}/></CardContent></Card><Card><CardHeader><CardTitle>Browsers</CardTitle></CardHeader><CardContent><BrowserChart data={browsers}/></CardContent></Card></div></div></>; }

function Funnel({ data }: { data: any }) {
  const steps: FunnelStep[] = Array.isArray(data?.steps) ? data.steps : [];
  const counts = { pageVisits: Number(data?.pageVisits ?? 0), formFocus: Number(data?.formFocus ?? 0), signupSubmitted: Number(data?.signupSubmitted ?? 0), referralShared: Number(data?.referralShared ?? 0) };
  const hasData = steps.some((step) => step.count > 0);
  if (!hasData) return <EmptyState title="No funnel data yet" description="Funnel analytics will appear once visitors begin interacting with your waitlist." />;
  const transitions = steps.slice(1).map((step, index) => { const previous = steps[index]; const continued = safePercent(step.count, previous.count); const dropOff = previous.count > 0 ? Math.max(0, previous.count - step.count) : 0; const dropOffRate = previous.count > 0 ? Math.max(0, Math.min(100, (dropOff / previous.count) * 100)) : null; return { from: previous.label, to: step.label, continued, dropped: dropOffRate === null ? "—" : `${dropOffRate.toFixed(0)}%`, dropOff, dropOffRate }; });
  const largestDropOff = transitions.filter((item) => item.dropOffRate !== null).sort((a, b) => (b.dropOffRate ?? -1) - (a.dropOffRate ?? -1))[0];
  return <div className="space-y-6"><div className="grid gap-4 md:grid-cols-2"><Metric icon={TrendingUp} label="Overall Signup Conversion" value={safePercent(counts.signupSubmitted, counts.pageVisits)} note={`${number(counts.signupSubmitted)} signups from ${number(counts.pageVisits)} page visits`}/><Metric icon={Share2} label="Referral Activation" value={safePercent(counts.referralShared, counts.signupSubmitted)} note={`${number(counts.referralShared)} referral shares from ${number(counts.signupSubmitted)} signups`}/></div><Card><CardHeader><CardTitle>Conversion Funnel</CardTitle><CardDescription>Signup funnel: Page Visit → Form Focus → Signup Submitted. Post-signup activation: Referral Link Shared.</CardDescription></CardHeader><CardContent><FunnelVisualization steps={steps}/></CardContent></Card><div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Conversion by Step</CardTitle><CardDescription>How many users continued from each previous stage.</CardDescription></CardHeader><CardContent className="space-y-4">{transitions.map((item) => <div className="space-y-2" key={`${item.from}-${item.to}`}><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-medium">{item.from} → {item.to}</span><span><b>{item.continued}</b> continued · {item.dropped} dropped</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: item.dropped === "—" ? "0%" : item.continued }}/></div></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Biggest Drop-off</CardTitle></CardHeader><CardContent>{largestDropOff ? <div className="space-y-3"><p className="font-medium">{largestDropOff.from} → {largestDropOff.to}</p><p className="text-4xl font-bold">{largestDropOff.dropped}</p><p className="text-sm text-muted-foreground">{number(largestDropOff.dropOff)} users did not continue to the next stage.</p><p className="text-sm text-muted-foreground">Your biggest drop-off happens between {largestDropOff.from} and {largestDropOff.to}.</p></div> : <p className="text-sm text-muted-foreground">Drop-off insights will appear after visitors move through the funnel.</p>}</CardContent></Card></div><div><h3 className="mb-3 text-base font-semibold">Stage Summary</h3><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{steps.map((step, index) => <Card key={step.type}><CardContent className="p-5"><p className="text-sm font-medium text-muted-foreground">{step.label}</p><p className="mt-3 text-2xl font-bold">{number(step.count)}</p><p className="mt-1 text-xs text-muted-foreground">{index === 0 ? "Starting point" : `${safePercent(step.count, steps[index - 1].count)} of ${steps[index - 1].label.toLowerCase()} users`}</p></CardContent></Card>)}</div></div></div>;
}
function Growth({ data, mode, setMode }: { data: any; mode: "hourly" | "daily"; setMode: (value: "hourly" | "daily") => void }) { const peak=data.summary.peakHour; return <><div className="grid gap-4 md:grid-cols-3"><Metric icon={Users} label="Total Signups" value={data.summary.totalSignups.toLocaleString()}/><Metric icon={TrendingUp} label="Peak Hour" value={peak?.signupCount?.toLocaleString() ?? "—"} note={peak ? new Date(peak.timestamp).toLocaleString() : "No data available"}/><Metric icon={Activity} label="Referral Spikes" value={data.summary.spikeCount}/></div><Card><CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>Signup Growth</CardTitle><CardDescription>{mode === "hourly" ? "Signups per hour" : "Signups per day"} with referral spikes marked.</CardDescription></div><select aria-label="Growth interval" value={mode} onChange={(event) => setMode(event.target.value as "hourly" | "daily")} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="hourly">Hourly</option><option value="daily">Daily</option></select></div></CardHeader><CardContent><GrowthVelocityChart data={data[mode]} spikes={data.spikes} viewMode={mode}/></CardContent></Card>{data.spikes.length>0&&<Card><CardHeader><CardTitle>Referral Spike Details</CardTitle></CardHeader><CardContent className="space-y-3">{data.spikes.map((s:any)=><div className="rounded-md border border-border p-3 text-sm" key={s.id}><b>{s.signupCount} signups</b> · {new Date(s.startAt).toLocaleString()} – {new Date(s.endAt).toLocaleString()}</div>)}</CardContent></Card>}</>; }
