import { api } from "@/lib/axios";

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export async function updateProfile(data: UpdateProfileDto) {
  const response = await api.patch<{
    success: boolean;
    data: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      avatar: string | null;
      role: string;
      provider: string;
      isEmailVerified: boolean;
      isTwoFactorEnabled: boolean;
      createdAt: string;
      updatedAt: string;
    };
  }>("/users/profile", data);

  return response.data.data;
}
