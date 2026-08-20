import { Test, TestingModule } from '@nestjs/testing';
import { MonetizationService } from './monetization.service';
import { FeeService } from './fee.service';
import { StripeMonetizationProvider } from './providers/stripe-monetization.provider';
import { ChapaMonetizationProvider } from './providers/chapa-monetization.provider';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentProvider } from '@prisma/client';

describe('MonetizationService', () => {
  let service: MonetizationService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonetizationService,
        {
          provide: PrismaService,
          useValue: {
            paymentAccount: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
              update: jest.fn(),
            },
            monetizationPayment: {
              create: jest.fn(),
              update: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
            },
            monetizationPaymentEvent: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn((cb) => cb(prisma)),
          },
        },
        {
          provide: FeeService,
          useValue: {
            calculateFees: jest.fn().mockReturnValue({ platformFee: 10, providerFee: 0, founderAmount: 90 }),
          },
        },
        {
          provide: StripeMonetizationProvider,
          useValue: {
            initializePayment: jest.fn().mockResolvedValue({ checkoutUrl: 'stripe_url', providerPaymentId: 'pi_123' }),
            verifyWebhookSignature: jest.fn().mockReturnValue(true),
            parseWebhookEvent: jest.fn().mockResolvedValue({ providerPaymentId: 'pi_123', status: 'SUCCESS', providerEventId: 'evt_123', eventType: 'checkout.session.completed', payload: {} }),
            exchangeCodeForAccountId: jest.fn().mockResolvedValue('acct_123'),
          },
        },
        {
          provide: ChapaMonetizationProvider,
          useValue: {
            initializePayment: jest.fn().mockResolvedValue({ checkoutUrl: 'chapa_url', providerPaymentId: 'tx_123' }),
            verifyWebhookSignature: jest.fn().mockReturnValue(true),
            parseWebhookEvent: jest.fn().mockResolvedValue({ providerPaymentId: 'tx_123', status: 'SUCCESS', providerEventId: 'tx_123_success', eventType: 'success', payload: {} }),
            createSubaccount: jest.fn().mockResolvedValue('sub_123'),
          },
        },
      ],
    }).compile();

    service = module.get<MonetizationService>(MonetizationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should get correct provider', () => {
    expect(service.getProvider(PaymentProvider.STRIPE)).toBeInstanceOf(Object);
  });

  // More complex tests would mock prisma responses and assert state transitions
});
