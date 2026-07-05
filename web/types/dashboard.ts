export interface DashboardParticipant {
  email: string;
  position: number;
  referralCount: number;
  createdAt: string;
}

export interface DashboardWaitlist {
  id: string;
  name: string;
  slug: string;
  totalParticipants: number;
}

export interface DashboardWaitlistDetail {
  waitlist: DashboardWaitlist;
  participants: DashboardParticipant[];
}

export interface DashboardOverview {
  totalSignups: number;
  referralConversionRate: number;
  topReferrers: Array<{
    email: string;
    referralCount: number;
    waitlistName: string;
  }>;
  waitlistCount: number;
}

export type SettingsTab = "profile" | "security" | "sessions";
