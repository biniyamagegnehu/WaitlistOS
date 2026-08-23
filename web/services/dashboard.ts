import { api } from "@/lib/axios";
import type {
  DashboardOverview,
  DashboardWaitlist,
  DashboardWaitlistDetail,
} from "@/types/dashboard";
import type { PageBuilderResponse, PageConfig } from "@/types/page-builder";

export async function getPageBuilder(waitlistId: string): Promise<PageBuilderResponse> {
  const response = await api.get<{ success: boolean; data: PageBuilderResponse }>(`/waitlists/${waitlistId}/page-builder`);
  return response.data.data;
}

export async function getSignupConfig(waitlistId: string) {
  const response = await api.get<{ success: boolean; data: any }>(`/waitlists/${waitlistId}/signup-config`);
  return response.data.data;
}

export async function updateSignupConfig(waitlistId: string, enabled: boolean, steps: any[]) {
  const response = await api.patch<{ success: boolean; data: any }>(`/waitlists/${waitlistId}/signup-config`, { enabled, steps });
  return response.data.data;
}

export async function savePageBuilder(waitlistId: string, config: PageConfig, version: number): Promise<PageBuilderResponse> {
  const response = await api.patch<{ success: boolean; data: PageBuilderResponse }>(`/waitlists/${waitlistId}/page-builder`, { config, version });
  return response.data.data;
}

export async function publishPageBuilder(waitlistId: string, version: number): Promise<PageBuilderResponse> {
  const response = await api.post<{ success: boolean; data: PageBuilderResponse }>(`/waitlists/${waitlistId}/page-builder/publish`, { version });
  return response.data.data;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const response = await api.get<DashboardOverview>("/dashboard/overview");
  return response.data;
}

export async function getDashboardWaitlists(options?: {
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'totalParticipants';
  sortOrder?: 'asc' | 'desc';
}): Promise<DashboardWaitlist[]> {
  const params = new URLSearchParams();
  
  if (options?.search) params.append('search', options.search);
  if (options?.sortBy) params.append('sortBy', options.sortBy);
  if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

  const queryString = params.toString();
  const url = queryString 
    ? `/dashboard/waitlists?${queryString}`
    : '/dashboard/waitlists';

  const response = await api.get<DashboardWaitlist[]>(url);
  return response.data;
}

export async function getDashboardWaitlistDetail(
  waitlistId: string,
  options?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: 'position' | 'referralCount' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    status?: 'WAITING' | 'INVITED' | 'ACCESSED';
  }
): Promise<DashboardWaitlistDetail> {
  const params = new URLSearchParams();
  
  if (options?.page) params.append('page', options.page.toString());
  if (options?.pageSize) params.append('pageSize', options.pageSize.toString());
  if (options?.search) params.append('search', options.search);
  if (options?.sortBy) params.append('sortBy', options.sortBy);
  if (options?.sortOrder) params.append('sortOrder', options.sortOrder);
  if (options?.status) params.append('status', options.status);

  const queryString = params.toString();
  const url = queryString 
    ? `/dashboard/waitlists/${waitlistId}?${queryString}`
    : `/dashboard/waitlists/${waitlistId}`;

  const response = await api.get<DashboardWaitlistDetail>(url);
  return response.data;
}

export async function getParticipantDetail(waitlistId: string, participantId: string) {
  const response = await api.get(`/dashboard/waitlists/${waitlistId}/participants/${participantId}`);
  return response.data;
}

export async function exportWaitlistCsv(waitlistId: string): Promise<void> {
  const response = await api.get<Blob>(`/dashboard/waitlists/${waitlistId}/export`, {
    responseType: "blob",
  });

  const disposition = response.headers["content-disposition"] as string | undefined;
  const filenameMatch = disposition?.match(/filename="(.+)"/);
  const filename = filenameMatch?.[1] ?? "participants.csv";

  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function exportWaitlist(waitlistId: string, format: 'csv' | 'xlsx' | 'doc' | 'pdf'): Promise<void> {
  const response = await api.get<Blob>(`/dashboard/waitlists/${waitlistId}/export/${format}`, {
    responseType: "blob",
  });

  const disposition = response.headers["content-disposition"] as string | undefined;
  const filenameMatch = disposition?.match(/filename="(.+)"/);
  const filename = filenameMatch?.[1] ?? `participants.${format}`;

  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function exportWaitlists(format: 'csv' | 'xlsx' | 'doc' | 'pdf'): Promise<void> {
  const response = await api.get<Blob>(`/dashboard/waitlists/export/${format}`, {
    responseType: "blob",
  });

  const disposition = response.headers["content-disposition"] as string | undefined;
  const filenameMatch = disposition?.match(/filename="(.+)"/);
  const filename = filenameMatch?.[1] ?? `waitlists.${format}`;

  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function updateWaitlist(
  waitlistId: string,
  data: {
    name?: string;
    tagline?: string;
    description?: string;
    logoId?: string;
    slug?: string;
    doubleSidedRewardsEnabled?: boolean;
    referrerRankingBonus?: number;
    newParticipantRankingBonus?: number;
    streakBonusesEnabled?: boolean;
    themeMode?: 'SYSTEM' | 'LIGHT' | 'DARK';
    skipLineEnabled?: boolean;
    skipLinePrice?: number;
    skipLineCurrency?: string;
  }
): Promise<DashboardWaitlist> {
  const response = await api.patch<DashboardWaitlist>(
    `/waitlists/${waitlistId}`,
    data
  );
  return response.data;
}

export async function deleteWaitlist(waitlistId: string): Promise<void> {
  await api.delete(`/waitlists/${waitlistId}`);
}
