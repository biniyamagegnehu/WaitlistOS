import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

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

  /** Get the Founder ID from a User ID */
  private async getFounderId(userId: string): Promise<string> {
    const founder = await this.prisma.founder.findUnique({
      where: { userId },
    });

    if (!founder) {
      throw new NotFoundException('Founder profile not found');
    }

    return founder.id;
  }

  // ── List all waitlists owned by the founder ──────────────────────────────
  async getWaitlists(userId: string): Promise<DashboardWaitlist[]> {
    const founderId = await this.getFounderId(userId);

    const waitlists = await this.prisma.waitlist.findMany({
      where: { founderId },
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
    userId: string,
  ): Promise<DashboardWaitlistDetail> {
    const founderId = await this.getFounderId(userId);

    const waitlist = await this.prisma.waitlist.findFirst({
      where: { id: waitlistId, founderId },
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
  async exportCsv(waitlistId: string, userId: string): Promise<{ csv: string; slug: string }> {
    const founderId = await this.getFounderId(userId);

    const waitlist = await this.prisma.waitlist.findFirst({
      where: { id: waitlistId, founderId },
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
