import { api } from "@/lib/axios";
import type { TrafficSource } from "@/lib/attribution-resolver";

export interface SourcePerformance {
  source: TrafficSource;
  visitors: number;
  signups: number;
  conversionRate: number;
}

export interface AnalyticsResponse {
  totalVisitors: number;
  totalSignups: number;
  overallConversionRate: number;
  sources: SourcePerformance[];
}

export type FunnelEventType = "PAGE_VISIT" | "FORM_FOCUS" | "SIGNUP_SUBMITTED" | "REFERRAL_SHARED";

export interface FunnelStep {
  type: FunnelEventType;
  label: string;
  count: number;
  conversionRate: number | null;
  dropOff: number | null;
  dropOffRate: number | null;
}

export interface ConversionFunnelResponse {
  pageVisits: number;
  formFocus: number;
  signupSubmitted: number;
  referralShared: number;
  overallSignupConversion: number | null;
  referralShareRate: number | null;
  steps: FunnelStep[];
}

export async function getWaitlistAnalytics(
  waitlistId: string,
  from?: string,
  to?: string
): Promise<AnalyticsResponse> {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const query = params.toString();
  const url = `/waitlists/${waitlistId}/analytics/sources${query ? `?${query}` : ""}`;

  const response = await api.get<AnalyticsResponse>(url);
  return response.data;
}

export interface AudienceCountry {
  code: string;
  name: string;
  signups: number;
  percentage: number;
}

export interface AudienceDevice {
  type: "MOBILE" | "DESKTOP" | "TABLET" | "UNKNOWN";
  label: string;
  signups: number;
  percentage: number;
}

export interface AudienceBrowser {
  name: string;
  signups: number;
  percentage: number;
}

export interface AudienceAnalyticsResponse {
  totalSignups: number;
  geoAnalyzedSignups: number;
  countries: AudienceCountry[];
  devices: AudienceDevice[];
  browsers: AudienceBrowser[];
}

export async function getAudienceAnalytics(
  waitlistId: string,
  from?: string,
  to?: string
): Promise<AudienceAnalyticsResponse> {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const query = params.toString();
  const url = `/waitlists/${waitlistId}/analytics/audience${query ? `?${query}` : ""}`;

  const response = await api.get<AudienceAnalyticsResponse>(url);
  return response.data;
}

export async function getConversionFunnel(
  waitlistId: string,
  from?: string,
  to?: string
): Promise<ConversionFunnelResponse> {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const query = params.toString();
  const url = `/waitlists/${waitlistId}/analytics/conversion-funnel${query ? `?${query}` : ""}`;

  const response = await api.get<ConversionFunnelResponse>(url);
  return response.data;
}
