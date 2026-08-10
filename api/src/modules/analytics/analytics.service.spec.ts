import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';
import { FunnelEventType, TrafficSource } from '@prisma/client';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const mockPrisma = {
    waitlist: {
      findUnique: jest.fn(),
    },
    attributionVisit: {
      findFirst: jest.fn(),
      create: jest.fn(),
      groupBy: jest.fn(),
    },
    participant: {
      groupBy: jest.fn(),
      count: jest.fn(),
    },
    funnelEvent: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    dailyFunnelStat: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordFunnelEvent', () => {
    it('should create a new funnel event', async () => {
      const waitlistId = 'waitlist-1';
      const sessionId = 'session-1';
      const eventType = FunnelEventType.PAGE_VISIT;

      mockPrisma.waitlist.findUnique.mockResolvedValue({ id: waitlistId });
      mockPrisma.funnelEvent.findFirst.mockResolvedValue(null);
      mockPrisma.funnelEvent.create.mockResolvedValue({ id: 'event-1' });

      const result = await service.recordFunnelEvent(waitlistId, sessionId, eventType);

      expect(mockPrisma.funnelEvent.create).toHaveBeenCalledWith({
        data: { waitlistId, sessionId, eventType },
      });
      expect(result).toEqual({ id: 'event-1' });
    });

    it('should deduplicate existing funnel events', async () => {
      const waitlistId = 'waitlist-1';
      const sessionId = 'session-1';
      const eventType = FunnelEventType.PAGE_VISIT;
      const existingEvent = { id: 'event-1' };

      mockPrisma.waitlist.findUnique.mockResolvedValue({ id: waitlistId });
      mockPrisma.funnelEvent.findFirst.mockResolvedValue(existingEvent);

      const result = await service.recordFunnelEvent(waitlistId, sessionId, eventType);

      expect(mockPrisma.funnelEvent.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingEvent);
    });

    it('should throw NotFoundException if waitlist does not exist', async () => {
      mockPrisma.waitlist.findUnique.mockResolvedValue(null);

      await expect(
        service.recordFunnelEvent('invalid-id', 'session-1', FunnelEventType.PAGE_VISIT),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordFunnelEventBySlug', () => {
    it('should record funnel event by slug', async () => {
      const slug = 'my-waitlist';
      const sessionId = 'session-1';
      const eventType = FunnelEventType.FORM_FOCUS;
      const waitlist = { id: 'waitlist-1' };

      mockPrisma.waitlist.findUnique.mockResolvedValue(waitlist);
      mockPrisma.funnelEvent.findFirst.mockResolvedValue(null);
      mockPrisma.funnelEvent.create.mockResolvedValue({ id: 'event-1' });

      await service.recordFunnelEventBySlug(slug, sessionId, eventType);

      expect(mockPrisma.waitlist.findUnique).toHaveBeenCalledWith({
        where: { slug },
      });
      expect(mockPrisma.funnelEvent.create).toHaveBeenCalled();
    });
  });

  describe('getConversionFunnel', () => {
    it('should return conversion funnel data with ownership check', async () => {
      const waitlistId = 'waitlist-1';
      const userId = 'user-1';
      const waitlist = {
        id: waitlistId,
        founder: { userId },
      };

      mockPrisma.waitlist.findUnique.mockResolvedValue(waitlist);
      mockPrisma.dailyFunnelStat.findMany.mockResolvedValue([
        { eventType: FunnelEventType.PAGE_VISIT, count: 1000 },
        { eventType: FunnelEventType.FORM_FOCUS, count: 500 },
        { eventType: FunnelEventType.SIGNUP_SUBMITTED, count: 200 },
        { eventType: FunnelEventType.REFERRAL_SHARED, count: 50 },
      ]);

      const result = await service.getConversionFunnel(waitlistId, userId);

      expect(result).toMatchObject({
        pageVisits: 1000,
        formFocus: 500,
        signupSubmitted: 200,
        referralShared: 50,
        overallSignupConversion: 20,
        referralShareRate: 25,
      });
      expect(result.steps).toHaveLength(4);
    });

    it('should throw UnauthorizedException if user does not own waitlist', async () => {
      const waitlistId = 'waitlist-1';
      const userId = 'user-1';
      const waitlist = {
        id: waitlistId,
        founder: { userId: 'other-user' },
      };

      mockPrisma.waitlist.findUnique.mockResolvedValue(waitlist);

      await expect(
        service.getConversionFunnel(waitlistId, userId),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if waitlist does not exist', async () => {
      mockPrisma.waitlist.findUnique.mockResolvedValue(null);

      await expect(
        service.getConversionFunnel('invalid-id', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle empty data gracefully', async () => {
      const waitlistId = 'waitlist-1';
      const userId = 'user-1';
      const waitlist = {
        id: waitlistId,
        founder: { userId },
      };

      mockPrisma.waitlist.findUnique.mockResolvedValue(waitlist);
      mockPrisma.dailyFunnelStat.findMany.mockResolvedValue([]);

      const result = await service.getConversionFunnel(waitlistId, userId);

      expect(result).toMatchObject({
        pageVisits: 0,
        formFocus: 0,
        signupSubmitted: 0,
        referralShared: 0,
        overallSignupConversion: null,
        referralShareRate: null,
      });
    });
  });

  describe('getSourceAnalytics', () => {
    it('should return source analytics with ownership check', async () => {
      const waitlistId = 'waitlist-1';
      const userId = 'user-1';
      const waitlist = {
        id: waitlistId,
        founder: { userId },
      };

      mockPrisma.waitlist.findUnique.mockResolvedValue(waitlist);
      mockPrisma.attributionVisit.groupBy.mockResolvedValue([
        { source: TrafficSource.DIRECT, _count: { sessionId: 100 } },
      ]);
      mockPrisma.participant.groupBy.mockResolvedValue([
        { source: TrafficSource.DIRECT, _count: { id: 50 } },
      ]);

      const result = await service.getSourceAnalytics(waitlistId, userId);

      expect(result).toMatchObject({
        totalVisitors: 100,
        totalSignups: 50,
        sources: expect.arrayContaining([
          expect.objectContaining({
            source: TrafficSource.DIRECT,
            visitors: 100,
            signups: 50,
          }),
        ]),
      });
    });

    it('should throw UnauthorizedException for unauthorized access', async () => {
      const waitlistId = 'waitlist-1';
      const userId = 'user-1';
      const waitlist = {
        id: waitlistId,
        founder: { userId: 'other-user' },
      };

      mockPrisma.waitlist.findUnique.mockResolvedValue(waitlist);

      await expect(
        service.getSourceAnalytics(waitlistId, userId),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getAudienceAnalytics', () => {
    it('should return audience analytics with ownership check', async () => {
      const waitlistId = 'waitlist-1';
      const userId = 'user-1';
      const waitlist = {
        id: waitlistId,
        founder: { userId },
      };

      mockPrisma.waitlist.findUnique.mockResolvedValue(waitlist);
      mockPrisma.participant.count.mockResolvedValue(100);
      mockPrisma.participant.groupBy
        .mockResolvedValueOnce([{ countryCode: 'US', _count: { _all: 50 } }])
        .mockResolvedValueOnce([{ deviceType: 'DESKTOP', _count: { _all: 60 } }])
        .mockResolvedValueOnce([{ browserName: 'Chrome', _count: { _all: 70 } }]);

      const result = await service.getAudienceAnalytics(waitlistId, userId);

      expect(result).toMatchObject({
        totalSignups: 100,
        countries: expect.arrayContaining([
          expect.objectContaining({
            code: 'US',
            signups: 50,
          }),
        ]),
        devices: expect.arrayContaining([
          expect.objectContaining({
            type: 'DESKTOP',
            signups: 60,
          }),
        ]),
        browsers: expect.arrayContaining([
          expect.objectContaining({
            name: 'Chrome',
            signups: 70,
          }),
        ]),
      });
    });

    it('should throw UnauthorizedException for unauthorized access', async () => {
      const waitlistId = 'waitlist-1';
      const userId = 'user-1';
      const waitlist = {
        id: waitlistId,
        founder: { userId: 'other-user' },
      };

      mockPrisma.waitlist.findUnique.mockResolvedValue(waitlist);

      await expect(
        service.getAudienceAnalytics(waitlistId, userId),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
