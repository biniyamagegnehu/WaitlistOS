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

export interface ReferralMessages {
  twitter: string;
  linkedin: string;
  whatsapp: string;
}

export interface UnlockedStreakReward {
  id: string;
  days: number;
  title: string | null;
  type: string;
  value: number | null;
  unlockedAt: string;
}

export interface ParticipantStreak {
  current: number;
  longest: number;
  referredToday: boolean;
  active: boolean;
  nextMilestone: { id: string; days: number; type: string; value: number | null; title: string | null } | null;
  unlockedRewards: UnlockedStreakReward[];
}

export interface JoinResponse {
  success: boolean;
  id: string;
  email: string;
  position: number;
  referralCode: string;
  referralCount: number;
  referralLink: string;
  rewardProgress?: RewardProgress;
  unlockedRewards?: UnlockedReward[];
  streak?: ParticipantStreak;
}

export interface JoinWaitlistInput {
  waitlistSlug: string;
  email: string;
  referralCode?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
  landingPath?: string;
  sessionId?: string;
}
