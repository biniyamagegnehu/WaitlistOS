import { API_URL } from '../lib/constants';
import { JoinResponse, JoinErrorCode } from '../types/participant';

export class JoinWaitlistError extends Error {
  constructor(public code: JoinErrorCode, message: string) {
    super(message);
    this.name = 'JoinWaitlistError';
  }
}

export async function joinWaitlist(data: {
  waitlistSlug: string;
  email: string;
  referralCode?: string;
}): Promise<JoinResponse> {
  const res = await fetch(`${API_URL}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (res.ok) {
    return res.json();
  }

  // Try to parse error body for specific code
  const body = await res.json().catch(() => ({}));
  const serverMessage: string = body?.message ?? '';

  if (res.status === 404 || serverMessage === 'WAITLIST_NOT_FOUND') {
    throw new JoinWaitlistError('WAITLIST_NOT_FOUND', 'Waitlist not found');
  }
  if (res.status === 409 || serverMessage === 'EMAIL_ALREADY_JOINED') {
    throw new JoinWaitlistError('EMAIL_ALREADY_JOINED', 'You have already joined this waitlist');
  }
  if (serverMessage === 'INVALID_REFERRAL') {
    throw new JoinWaitlistError('INVALID_REFERRAL', 'The referral link is invalid');
  }
  if (serverMessage === 'SELF_REFERRAL') {
    throw new JoinWaitlistError('SELF_REFERRAL', 'You cannot use your own referral link');
  }

  throw new JoinWaitlistError('SERVER_ERROR', 'Something went wrong. Please try again.');
}
