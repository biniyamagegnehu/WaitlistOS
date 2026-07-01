import Link from 'next/link';
import { getDashboardWaitlists } from '../../services/dashboard';
import { WaitlistCard } from '../../components/dashboard/WaitlistCard';
import type { DashboardWaitlist } from '../../types/dashboard';

export const metadata = {
  title: 'Founder Dashboard — WaitlistOS',
  description: 'View and manage your waitlists',
};

export default async function DashboardPage() {
  let waitlists: DashboardWaitlist[] = [];
  let fetchError = false;

  try {
    waitlists = await getDashboardWaitlists();
  } catch {
    fetchError = true;
    waitlists = [];
  }

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white">
      {/* ── Background gradient ─────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-14">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-indigo-400">
              WaitlistOS
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Founder Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              All your waitlists in one place.
            </p>
          </div>

          <Link
            href="/create"
            id="create-waitlist-link"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Waitlist
          </Link>
        </header>

        {/* ── Error state ─────────────────────────────────────────────────── */}
        {fetchError && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm text-red-400">
            Could not load waitlists. Make sure the API server is running.
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {!fetchError && waitlists.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-24 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold text-zinc-300">
              No waitlists yet
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Create your first waitlist to get started.
            </p>
            <Link
              href="/create"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500"
            >
              Create a Waitlist
            </Link>
          </div>
        )}

        {/* ── Waitlist grid ────────────────────────────────────────────────── */}
        {waitlists.length > 0 && (
          <>
            <p className="mb-4 text-xs font-medium text-zinc-500">
              {waitlists.length} waitlist{waitlists.length !== 1 ? 's' : ''}
            </p>
            <div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              id="waitlist-grid"
            >
              {waitlists.map((w) => (
                <WaitlistCard key={w.id} waitlist={w} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
