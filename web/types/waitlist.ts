import type { WaitlistCopy } from "./copywriter";
import type { PageConfig } from "./page-builder";

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
  urgencyEnabled?: boolean;
  batchEnabled?: boolean;
  batchName?: string | null;
  batchSize?: number | null;
  batchDescription?: string | null;
  countdownEnabled?: boolean;
  launchDate?: string | null;
  showRemainingSpots?: boolean;
  showBatchProgress?: boolean;
  showCountdown?: boolean;
  batchUrgency?: {
    size: number;
    number: number;
    participants: number;
    remaining: number;
    progress: number;
    status: 'NEW' | 'ACTIVE' | 'NEARLY_FULL';
    launch: { date: string; status: 'UPCOMING' | 'LIVE' } | null;
  } | null;
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
  pageConfig?: PageConfig | null;
}

export interface UploadedFile {
  id: string;
  url: string;
  secureUrl: string;
}
