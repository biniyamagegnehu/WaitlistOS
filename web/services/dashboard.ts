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
  waitlistId: string
): Promise<DashboardWaitlistDetail> {
  const response = await api.get<DashboardWaitlistDetail>(
    `/dashboard/waitlists/${waitlistId}`
  );
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
