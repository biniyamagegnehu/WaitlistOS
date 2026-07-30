import { api } from "@/lib/axios";

export interface GeneratedWaitlist {
  productName: string;
  tagline: string;
  description?: string;
}

export async function generateWaitlistWithAi(
  description: string
): Promise<GeneratedWaitlist> {
  const response = await api.post<GeneratedWaitlist>("/ai/build-waitlist", {
    description,
  });

  // axios response.data contains the body. Our backend returns the JSON directly.
  return response.data;
}
