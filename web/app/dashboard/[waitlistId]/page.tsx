import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDashboardWaitlistDetail } from '../../../services/dashboard';
import { ParticipantTable } from '../../../components/dashboard/ParticipantTable';
import { ExportButton } from '../../../components/dashboard/ExportButton';

interface WaitlistDetailPageProps {
  params: Promise<{ waitlistId: string }>;
}

export async function generateMetadata({ params }: WaitlistDetailPageProps) {
  const { waitlistId } = await params;
  try {
    const { waitlist } = await getDashboardWaitlistDetail(waitlistId);
    return {
      title: `${waitlist.name} — WaitlistOS Dashboard`,
      description: `Manage participants for ${waitlist.name}`,
    };
  } catch {
    return { title: 'Waitlist — WaitlistOS Dashboard' };
  }
}

export default async function WaitlistDetailPage({ params }: WaitlistDetailPageProps) {
  const { waitlistId } = await params;

  let detail;
  try {
    detail = await getDashboardWaitlistDetail(waitlistId);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'WAITLIST_NOT_FOUND') {
      notFound();
    }
    throw err;
  }

  const { waitlist, participants } = detail;

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
        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/dashboard" className="transition-colors hover:text-zinc-300">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-zinc-300">{waitlist.name}</span>
        </nav>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {waitlist.name}
            </h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-zinc-400">
              <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-zinc-300 ring-1 ring-white/10">
                /{waitlist.slug}
              </span>
              <span>·</span>
              <span>
                {waitlist.totalParticipants}{' '}
                {waitlist.totalParticipants === 1 ? 'participant' : 'participants'}
              </span>
            </div>
          </div>

          <ExportButton waitlistId={waitlist.id} />
        </header>

        {/* ── Stat pills ──────────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-wrap gap-3">
          <StatPill
            label="Total Signups"
            value={waitlist.totalParticipants}
            color="indigo"
          />
          <StatPill
            label="With Referrals"
            value={participants.filter((p) => p.referralCount > 0).length}
            color="emerald"
          />
          <StatPill
            label="Total Referrals"
            value={participants.reduce((acc, p) => acc + p.referralCount, 0)}
            color="violet"
          />
        </div>

        {/* ── Participant table ────────────────────────────────────────────── */}
        <ParticipantTable participants={participants} />
      </div>
    </div>
  );
}

// ── Small stat pill ──────────────────────────────────────────────────────
interface StatPillProps {
  label: string;
  value: number;
  color: 'indigo' | 'emerald' | 'violet';
}

const colorMap: Record<StatPillProps['color'], string> = {
  indigo: 'bg-indigo-500/15 text-indigo-300 ring-indigo-500/20',
  emerald: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
  violet: 'bg-violet-500/15 text-violet-300 ring-violet-500/20',
};

function StatPill({ label, value, color }: StatPillProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm ring-1 ${colorMap[color]}`}
    >
      <span className="font-bold">{value}</span>
      <span className="opacity-75">{label}</span>
    </div>
  );
}
