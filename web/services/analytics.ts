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
