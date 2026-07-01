import type { DashboardParticipant } from '../../types/dashboard';

interface ParticipantTableProps {
  participants: DashboardParticipant[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ParticipantTable({ participants }: ParticipantTableProps) {
  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <p className="text-base font-medium text-zinc-300">No participants yet</p>
        <p className="mt-1 text-sm text-zinc-500">
          Share your waitlist link to start collecting signups.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full text-sm" id="participant-table">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
              #
            </th>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Email
            </th>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Position
            </th>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Referrals
            </th>
            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Joined
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {participants.map((p, i) => (
            <tr
              key={p.email}
              className="transition-colors hover:bg-white/5"
              id={`participant-row-${i + 1}`}
            >
              <td className="px-5 py-4 text-zinc-500">{i + 1}</td>
              <td className="px-5 py-4 font-medium text-white">{p.email}</td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-medium text-indigo-300">
                  #{p.position}
                </span>
              </td>
              <td className="px-5 py-4">
                {p.referralCount > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                    ✦ {p.referralCount}
                  </span>
                ) : (
                  <span className="text-zinc-600">—</span>
                )}
              </td>
              <td className="px-5 py-4 text-zinc-400">{formatDate(p.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
