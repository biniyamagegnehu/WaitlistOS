import { api } from "@/lib/axios";
import type { Reward, CreateRewardDto, UpdateRewardDto, RewardAnalytics } from "@/types/reward";

export async function getWaitlistRewards(waitlistId: string): Promise<Reward[]> {
  const response = await api.get<Reward[]>(`/waitlists/${waitlistId}/rewards`);
  return response.data;
}

export async function getWaitlistRewardAnalytics(waitlistId: string): Promise<RewardAnalytics> {
  const response = await api.get<RewardAnalytics>(`/waitlists/${waitlistId}/rewards/analytics`);
  return response.data;
}

export async function createReward(waitlistId: string, data: CreateRewardDto): Promise<Reward> {
  const response = await api.post<Reward>(`/waitlists/${waitlistId}/rewards`, data);
  return response.data;
}

export async function updateReward(waitlistId: string, rewardId: string, data: UpdateRewardDto): Promise<Reward> {
  const response = await api.patch<Reward>(`/waitlists/${waitlistId}/rewards/${rewardId}`, data);
  return response.data;
}

export async function deleteReward(waitlistId: string, rewardId: string): Promise<void> {
  await api.delete(`/waitlists/${waitlistId}/rewards/${rewardId}`);
}
