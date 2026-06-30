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
}): Promise<JoinResponse> {
  const res = await fetch(`${API_URL}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (res.ok) {
    return res.json();
  }

  // Map HTTP status codes to user-friendly error codes
  if (res.status === 404) {
    throw new JoinWaitlistError('WAITLIST_NOT_FOUND', 'Waitlist not found');
  }

  if (res.status === 409) {
    throw new JoinWaitlistError(
      'EMAIL_ALREADY_JOINED',
      'You have already joined this waitlist',
    );
  }

  throw new JoinWaitlistError('SERVER_ERROR', 'Something went wrong. Please try again.');
}
