import { api } from "@/lib/axios";

export interface StreakMilestoneDto {
  id: string;
  days: number;
  type: string;
  value: number | null;
  title: string | null;
  description: string | null;
  _count?: { participantStreakRewards: number };
}

export interface CreateStreakMilestoneInput {
  days: number;
  type: "POSITION_BOOST";
  value?: number;
  title?: string;
  description?: string;
}

export interface UpdateStreakMilestoneInput {
  days?: number;
  type?: "POSITION_BOOST";
  value?: number;
  title?: string;
  description?: string;
}

export interface StreakAnalytics {
  activeStreakers: number;
  longestCurrentStreak: number;
  longestCurrentStreakEmail: string | null;
  longestAllTimeStreak: number;
  longestAllTimeStreakEmail: string | null;
  totalRewardsUnlocked: number;
  mostPopularMilestoneDays: number | null;
  milestones: Array<{
    id: string;
    days: number;
    type: string;
    value: number | null;
    title: string | null;
    description: string | null;
    timesUnlocked: number;
  }>;
}

export async function getStreakMilestones(waitlistId: string): Promise<StreakMilestoneDto[]> {
  const response = await api.get<StreakMilestoneDto[]>(`/waitlists/${waitlistId}/streak-milestones`);
  return response.data;
}

export async function getStreakAnalytics(waitlistId: string): Promise<StreakAnalytics> {
  const response = await api.get<StreakAnalytics>(`/waitlists/${waitlistId}/streak-milestones/analytics`);
  return response.data;
}

export async function createStreakMilestone(waitlistId: string, data: CreateStreakMilestoneInput): Promise<StreakMilestoneDto> {
  const response = await api.post<StreakMilestoneDto>(`/waitlists/${waitlistId}/streak-milestones`, data);
  return response.data;
}

export async function updateStreakMilestone(waitlistId: string, milestoneId: string, data: UpdateStreakMilestoneInput): Promise<StreakMilestoneDto> {
  const response = await api.patch<StreakMilestoneDto>(`/waitlists/${waitlistId}/streak-milestones/${milestoneId}`, data);
  return response.data;
}

export async function deleteStreakMilestone(waitlistId: string, milestoneId: string): Promise<void> {
  await api.delete(`/waitlists/${waitlistId}/streak-milestones/${milestoneId}`);
}
