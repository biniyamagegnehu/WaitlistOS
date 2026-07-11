export type JoinErrorCode =
  | "WAITLIST_NOT_FOUND"
  | "EMAIL_ALREADY_JOINED"
  | "INVALID_REFERRAL"
  | "SELF_REFERRAL"
  | "SERVER_ERROR";

export interface RewardProgress {
  current: number;
  target: number;
  percent: number;
}

export interface UnlockedReward {
  id: string;
  title: string;
  unlockedAt: string;
  type: string;
  value: number | null;
}

export interface JoinResponse {
  success: boolean;
  email: string;
  position: number;
  referralCode: string;
  referralCount: number;
  referralLink: string;
  rewardProgress?: RewardProgress;
  unlockedRewards?: UnlockedReward[];
}

export interface JoinWaitlistInput {
  waitlistSlug: string;
  email: string;
  referralCode?: string;
}
