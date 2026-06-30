export interface JoinResponse {
  success: boolean;
  email: string;
  position: number;
}

export type JoinErrorCode =
  | 'WAITLIST_NOT_FOUND'
  | 'EMAIL_ALREADY_JOINED'
  | 'SERVER_ERROR';

export interface JoinError {
  code: JoinErrorCode;
  message: string;
}
