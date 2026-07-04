import { api } from "@/lib/axios";
import type { CreateWaitlistInput, Waitlist } from "@/types";

export async function createWaitlist(data: CreateWaitlistInput): Promise<Waitlist> {
  const response = await api.post<Waitlist>("/waitlists", data);
  return response.data;
}

export async function getWaitlistBySlug(slug: string): Promise<Waitlist | null> {
  try {
    const response = await api.get<Waitlist>(`/waitlists/${slug}`);
    return response.data;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      (error as { response?: { status?: number } }).response?.status === 404
    ) {
      return null;
    }

    throw error;
  }
}
