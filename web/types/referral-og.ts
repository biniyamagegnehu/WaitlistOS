import type { WaitlistBranding } from "@/types/waitlist";

export interface RewardProgress {
  current: number;
  target: number;
  percent: number;
}

export interface ReferralParticipantOg {
  displayName: string | null;
  position: number;
  referralCount: number;
  rewardProgress: RewardProgress;
}

export interface ReferralWaitlistOg {
  name: string;
  tagline: string;
  slug: string;
}

export interface ReferralOgData {
  participant: ReferralParticipantOg;
  waitlist: ReferralWaitlistOg;
  branding: WaitlistBranding | null;
}

export interface ReferralOgApiResponse {
  success: boolean;
  data: ReferralOgData;
}
