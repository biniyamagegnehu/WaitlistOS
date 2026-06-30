import { API_URL } from '../lib/constants';
import { CreateWaitlistInput, Waitlist } from '../types';

export async function createWaitlist(data: CreateWaitlistInput): Promise<Waitlist> {
  const res = await fetch(`${API_URL}/waitlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create waitlist');
  }
  
  return res.json();
}

export async function getWaitlistBySlug(slug: string): Promise<Waitlist | null> {
  const res = await fetch(`${API_URL}/waitlists/${slug}`, {
    cache: 'no-store'
  });
  
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch waitlist');
  }
  
  return res.json();
}
