import { api } from "@/lib/axios";
import type {
  CreateWaitlistInput,
  CreateWaitlistResponse,
  PublicWaitlistResponse,
} from "@/types/waitlist";

export async function createWaitlist(
  data: CreateWaitlistInput
): Promise<CreateWaitlistResponse> {
  const response = await api.post<{
    success: boolean;
    data: CreateWaitlistResponse;
  }>("/waitlists", data);

  return response.data.data;
}

export async function getPublicWaitlistBySlug(
  slug: string
): Promise<PublicWaitlistResponse | null> {
  try {
    const response = await api.get<{
      success: boolean;
      data: PublicWaitlistResponse;
    }>(`/w/${slug}`);

    return response.data.data;
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
