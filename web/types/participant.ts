export type JoinErrorCode =
  | "WAITLIST_NOT_FOUND"
  | "EMAIL_ALREADY_JOINED"
  | "INVALID_REFERRAL"
  | "SELF_REFERRAL"
  | "SERVER_ERROR";

export interface JoinResponse {
  success: boolean;
  email: string;
  position: number;
  referralCode: string;
  referralCount: number;
  referralLink: string;
}

export interface JoinWaitlistInput {
  waitlistSlug: string;
  email: string;
  referralCode?: string;
}
