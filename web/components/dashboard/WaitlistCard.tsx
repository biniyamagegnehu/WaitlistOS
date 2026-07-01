import Link from 'next/link';
import type { DashboardWaitlist } from '../../types/dashboard';

interface WaitlistCardProps {
  waitlist: DashboardWaitlist;
}

export function WaitlistCard({ waitlist }: WaitlistCardProps) {
  return (
    <Link
      href={`/dashboard/${waitlist.id}`}
      id={`waitlist-card-${waitlist.id}`}
      className="group block rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-200 hover:border-indigo-500/50 hover:bg-white/10 hover:shadow-lg hover:shadow-indigo-500/10"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-white transition-colors group-hover:text-indigo-300">
            {waitlist.name}
          </h2>
          <p className="mt-1 truncate text-sm text-zinc-400">
            /{waitlist.slug}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300 ring-1 ring-indigo-500/30">
          {waitlist.totalParticipants}{' '}
          {waitlist.totalParticipants === 1 ? 'member' : 'members'}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-1 text-xs text-zinc-500 transition-colors group-hover:text-zinc-400">
        <span>View participants</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5 translate-x-0 transition-transform group-hover:translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
