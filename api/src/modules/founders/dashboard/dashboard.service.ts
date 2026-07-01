import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/** Temporary founder ID used when no auth session exists yet.
 *  Replace this with a real JWT claim in Phase 9. */
export const TEMP_FOUNDER_ID = process.env.TEMP_FOUNDER_ID ?? 'temp-founder-id';

export interface DashboardWaitlist {
  id: string;
  name: string;
  slug: string;
  totalParticipants: number;
}

export interface DashboardParticipant {
  email: string;
  position: number;
  referralCount: number;
  createdAt: Date;
}

export interface DashboardWaitlistDetail {
  waitlist: DashboardWaitlist;
  participants: DashboardParticipant[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolve the effective founderId — prefers the supplied value, falls back to TEMP_FOUNDER_ID */
  private resolveFounderId(founderId?: string): string {
    return founderId?.trim() || TEMP_FOUNDER_ID;
  }

  // ── List all waitlists owned by the founder ──────────────────────────────
  async getWaitlists(founderId?: string): Promise<DashboardWaitlist[]> {
    const fid = this.resolveFounderId(founderId);

    const waitlists = await this.prisma.waitlist.findMany({
      where: { founderId: fid },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });

    return waitlists.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      totalParticipants: w._count.participants,
    }));
  }

  // ── Get a single waitlist with its participants ──────────────────────────
  async getWaitlistDetail(
    waitlistId: string,
    founderId?: string,
  ): Promise<DashboardWaitlistDetail> {
    const fid = this.resolveFounderId(founderId);

    const waitlist = await this.prisma.waitlist.findFirst({
      where: { id: waitlistId, founderId: fid },
      include: {
        _count: { select: { participants: true } },
        participants: {
          orderBy: { position: 'asc' },
          select: {
            email: true,
            position: true,
            referralCount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!waitlist) {
      throw new NotFoundException(
        `Waitlist ${waitlistId} not found or not owned by this founder`,
      );
    }

    return {
      waitlist: {
        id: waitlist.id,
        name: waitlist.name,
        slug: waitlist.slug,
        totalParticipants: waitlist._count.participants,
      },
      participants: waitlist.participants,
    };
  }

  // ── Generate a CSV string for a waitlist ────────────────────────────────
  async exportCsv(waitlistId: string, founderId?: string): Promise<{ csv: string; slug: string }> {
    const fid = this.resolveFounderId(founderId);

    const waitlist = await this.prisma.waitlist.findFirst({
      where: { id: waitlistId, founderId: fid },
      include: {
        participants: {
          orderBy: { position: 'asc' },
          select: {
            email: true,
            position: true,
            referralCount: true,
          },
        },
      },
    });

    if (!waitlist) {
      throw new NotFoundException(
        `Waitlist ${waitlistId} not found or not owned by this founder`,
      );
    }

    const header = 'email,position,referralCount';
    const rows = waitlist.participants.map(
      (p) => `${p.email},${p.position},${p.referralCount}`,
    );
    const csv = [header, ...rows].join('\n');

    return { csv, slug: waitlist.slug };
  }
}
