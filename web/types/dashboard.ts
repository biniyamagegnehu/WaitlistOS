export interface DashboardParticipant {
  email: string;
  position: number;
  referralCount: number;
  createdAt: string;
  status: string;
  engagement?: {
    riskScore: number;
    riskLevel: 'HEALTHY' | 'MEDIUM_RISK' | 'HIGH_RISK';
    lastEvaluatedAt: string;
  };
}

export interface DashboardWaitlist {
  id: string;
  name: string;
  tagline: string;
  slug: string;
  totalParticipants: number;
  description?: string | null;
  logoUrl?: string | null;
}

export interface PaginationMetadata {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface DashboardWaitlistDetail {
  waitlist: DashboardWaitlist;
  participants: DashboardParticipant[];
  pagination?: PaginationMetadata;
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
  health: {
    healthy: number;
    mediumRisk: number;
    highRisk: number;
  };
}

export type SettingsTab = "profile" | "security" | "sessions";
