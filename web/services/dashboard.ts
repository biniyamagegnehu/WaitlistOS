import { api } from "@/lib/axios";
import type {
  DashboardOverview,
  DashboardWaitlist,
  DashboardWaitlistDetail,
} from "@/types/dashboard";

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const response = await api.get<DashboardOverview>("/dashboard/overview");
  return response.data;
}

export async function getDashboardWaitlists(): Promise<DashboardWaitlist[]> {
  const response = await api.get<DashboardWaitlist[]>("/dashboard/waitlists");
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

export async function updateWaitlist(
  waitlistId: string,
  data: {
    name?: string;
    tagline?: string;
    description?: string;
    logoId?: string;
    slug?: string;
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
