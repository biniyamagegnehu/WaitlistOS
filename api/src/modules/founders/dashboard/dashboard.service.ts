import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentService } from '../../payments/payment.service';

export interface DashboardWaitlist {
  id: string;
  name: string;
  tagline: string;
  slug: string;
  totalParticipants: number;
  description?: string | null;
  logoUrl?: string | null;
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

export interface DashboardOverview {
  totalSignups: number;
  referralConversionRate: number;
  topReferrers: Array<{
    email: string;
    referralCount: number;
    waitlistName: string;
  }>;
  waitlistCount: number;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

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

  // ── Overview stats for the founder dashboard ─────────────────────────────
  async getOverview(userId: string): Promise<DashboardOverview> {
    const founderId = await this.getFounderId(userId);

    const waitlists = await this.prisma.waitlist.findMany({
      where: { founderId },
      select: {
        name: true,
        participants: {
          select: {
            email: true,
            referralCount: true,
            referredById: true,
          },
        },
      },
    });

    const participants = waitlists.flatMap((waitlist) =>
      waitlist.participants.map((participant) => ({
        ...participant,
        waitlistName: waitlist.name,
      })),
    );

    const totalSignups = participants.length;
    const referredSignups = participants.filter((p) => p.referredById).length;
    const referralConversionRate =
      totalSignups > 0 ? Math.round((referredSignups / totalSignups) * 1000) / 10 : 0;

    // Top referrers - available to all users
    const topReferrers = participants
      .filter((p) => p.referralCount > 0)
      .sort((a, b) => b.referralCount - a.referralCount)
      .slice(0, 5)
      .map((p) => ({
        email: p.email,
        referralCount: p.referralCount,
        waitlistName: p.waitlistName,
      }));

    return {
      totalSignups,
      referralConversionRate,
      topReferrers,
      waitlistCount: waitlists.length,
    };
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
        logo: true,
      },
    });

    return waitlists.map((w) => ({
      id: w.id,
      name: w.name,
      tagline: w.tagline,
      slug: w.slug,
      totalParticipants: w._count.participants,
      description: w.description,
      logoUrl: w.logo?.url || null,
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
        logo: true,
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
        tagline: waitlist.tagline,
        slug: waitlist.slug,
        totalParticipants: waitlist._count.participants,
        description: waitlist.description,
        logoUrl: waitlist.logo?.url || null,
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

    // Helper function to properly escape CSV values
    const escapeCsvValue = (val: unknown): string => {
      const stringified = String(val);
      if (/[",\n\r]/.test(stringified)) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    };

    const header = 'email,position,referralCount';
    const rows = waitlist.participants.map(
      (p) => [escapeCsvValue(p.email), escapeCsvValue(p.position), escapeCsvValue(p.referralCount)].join(','),
    );
    const csv = [header, ...rows].join('\n');

    return { csv, slug: waitlist.slug };
  }
}
