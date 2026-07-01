// ── Dashboard API types ───────────────────────────────────────────────────

export interface DashboardWaitlist {
  id: string;
  name: string;
  slug: string;
  totalParticipants: number;
}

export interface DashboardParticipant {
  email: string;
  position: number;
  referralCount: number;
  createdAt: string;
}

export interface DashboardWaitlistDetail {
  waitlist: DashboardWaitlist;
  participants: DashboardParticipant[];
}
