import { PrismaClient, SubscriptionPlanCode, BillingCycle } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('========== SEEDING SUBSCRIPTION PLANS ==========');

  const currency = process.env.PLANS_CURRENCY ?? 'USD';
  const freeMaxWaitlists = parseInt(process.env.PLANS_FREE_MAX_WAITLISTS ?? '1', 10);
  const freeMaxParticipants = parseInt(process.env.PLANS_FREE_MAX_PARTICIPANTS ?? '500', 10);
  const starterPrice = parseInt(process.env.PLANS_STARTER_PRICE ?? '19', 10);
  const starterMaxWaitlists = parseInt(process.env.PLANS_STARTER_MAX_WAITLISTS ?? '5', 10);
  const starterMaxParticipants = parseInt(process.env.PLANS_STARTER_MAX_PARTICIPANTS ?? '5000', 10);
  const proPrice = parseInt(process.env.PLANS_PRO_PRICE ?? '49', 10);

  // Free Plan
  await prisma.subscriptionPlan.upsert({
    where: { code: SubscriptionPlanCode.FREE },
    update: {},
    create: {
      code: SubscriptionPlanCode.FREE,
      name: 'Free',
      description: '1 waitlist, 500 signups',
      price: 0,
      currency,
      billingCycle: BillingCycle.FREE,
      maxWaitlists: freeMaxWaitlists,
      maxParticipants: freeMaxParticipants,
      features: {
        waitlists: freeMaxWaitlists,
        participants: freeMaxParticipants,
        customDomain: false,
        advancedAnalytics: false,
        prioritySupport: false,
      },
    },
  });

  // Starter Plan
  await prisma.subscriptionPlan.upsert({
    where: { code: SubscriptionPlanCode.STARTER },
    update: {},
    create: {
      code: SubscriptionPlanCode.STARTER,
      name: 'Starter',
      description: '5 waitlists, 5,000 signups',
      price: starterPrice,
      currency,
      billingCycle: BillingCycle.MONTHLY,
      maxWaitlists: starterMaxWaitlists,
      maxParticipants: starterMaxParticipants,
      features: {
        waitlists: starterMaxWaitlists,
        participants: starterMaxParticipants,
        customDomain: false,
        advancedAnalytics: true,
        prioritySupport: false,
      },
    },
  });

  // Pro Plan
  await prisma.subscriptionPlan.upsert({
    where: { code: SubscriptionPlanCode.PRO },
    update: {},
    create: {
      code: SubscriptionPlanCode.PRO,
      name: 'Pro',
      description: 'Unlimited waitlists, custom domain',
      price: proPrice,
      currency,
      billingCycle: BillingCycle.MONTHLY,
      maxWaitlists: null,
      maxParticipants: null,
      features: {
        waitlists: null,
        participants: null,
        customDomain: true,
        advancedAnalytics: true,
        prioritySupport: true,
      },
    },
  });

  console.log('========== PLANS SEEDED SUCCESSFULLY ==========');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
