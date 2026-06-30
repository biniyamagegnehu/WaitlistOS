export interface JoinResponse {
  success: boolean;
  email: string;
  position: number;
  referralCode: string;
  referralLink: string;
  referralCount: number;
}

export type JoinErrorCode =
  | 'WAITLIST_NOT_FOUND'
  | 'EMAIL_ALREADY_JOINED'
  | 'INVALID_REFERRAL'
  | 'SELF_REFERRAL'
  | 'SERVER_ERROR';

export interface JoinError {
  code: JoinErrorCode;
  message: string;
}
