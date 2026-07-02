import { API_URL } from '../lib/constants';
import type {
  DashboardWaitlist,
  DashboardWaitlistDetail,
} from '../types/dashboard';

/** Temporary founder ID — replace with JWT claim in Phase 9. */
export const TEMP_FOUNDER_ID = process.env.NEXT_PUBLIC_FOUNDER_ID ?? 'temp-founder-id';

function founderParam(founderId?: string): string {
  const id = founderId ?? TEMP_FOUNDER_ID;
  return `founderId=${encodeURIComponent(id)}`;
}

// ── Fetch all waitlists for a founder ────────────────────────────────────
export async function getDashboardWaitlists(
  founderId?: string,
  jwt?: string,
): Promise<DashboardWaitlist[]> {

  const res = await fetch(
    `${API_URL}/dashboard/waitlists?${founderParam(founderId)}`,
    { 
      cache: 'no-store',
      headers: {
        ...(jwt ? { Cookie: `jwt=${jwt}` } : {}),
      }
    },
  );
  if (!res.ok) {
    throw new Error('Failed to fetch dashboard waitlists');
  }
  return res.json();
}

// ── Fetch waitlist detail (waitlist + participants) ───────────────────────
export async function getDashboardWaitlistDetail(
  waitlistId: string,
  founderId?: string,
  jwt?: string,
): Promise<DashboardWaitlistDetail> {

  const res = await fetch(
    `${API_URL}/dashboard/waitlists/${waitlistId}?${founderParam(founderId)}`,
    { 
      cache: 'no-store',
      headers: {
        ...(jwt ? { Cookie: `jwt=${jwt}` } : {}),
      }
    },
  );
  if (!res.ok) {
    if (res.status === 404) throw new Error('WAITLIST_NOT_FOUND');
    throw new Error('Failed to fetch waitlist detail');
  }
  return res.json();
}

// ── Trigger CSV download in the browser ──────────────────────────────────
export async function exportWaitlistCsv(
  waitlistId: string,
  founderId?: string,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/dashboard/waitlists/${waitlistId}/export?${founderParam(founderId)}`,
    { credentials: 'include' }
  );
  if (!res.ok) throw new Error('Failed to export CSV');

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match ? match[1] : 'participants.csv';

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
