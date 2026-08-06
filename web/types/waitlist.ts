import type { WaitlistCopy } from "./copywriter";

export interface WaitlistBranding {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor?: string;
  backgroundColor?: string;
  buttonColor?: string;
  font?: string;
}

export interface WaitlistWidget {
  scriptUrl: string;
  embedCode: string;
}

export interface WaitlistReward {
  id: string;
  milestone: number;
  type: string;
  value: number | null;
  title: string;
  description: string | null;
  unlocked?: boolean;
}

export interface StreakMilestone {
  id: string;
  days: number;
  type: string;
  value: number | null;
  title: string | null;
  description: string | null;
  unlocked?: boolean;
}

export interface WaitlistSummary {
  id: string;
  name: string;
  tagline: string;
  slug: string;
  description?: string | null;
  participantCount?: number;
  rewards?: WaitlistReward[];
  streakBonusesEnabled?: boolean;
  streakMilestones?: StreakMilestone[];
  teamReferralsEnabled?: boolean;
  maxTeamSize?: number;
  teamMilestones?: Array<{ id: string; milestone: number; type: string; value: number | null; title: string | null }>;
}

export interface CreateWaitlistInput {
  name: string;
  tagline: string;
  logoId: string;
  description?: string;
}

export interface CreateWaitlistResponse {
  waitlist: WaitlistSummary;
  branding: WaitlistBranding | null;
  hostedPage: string;
  widget: WaitlistWidget | null;
}

export interface TeamLeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  memberCount: number;
  totalReferrals: number;
}

export interface PublicWaitlistResponse {
  waitlist: WaitlistSummary;
  branding: WaitlistBranding | null;
  hostedPage: string;
  widget: WaitlistWidget | null;
  copy?: Pick<WaitlistCopy, 'headline' | 'subheadline' | 'cta' | 'features' | 'faqs'> | null;
  teamLeaderboard?: TeamLeaderboardEntry[];
}

export interface UploadedFile {
  id: string;
  url: string;
  secureUrl: string;
}
