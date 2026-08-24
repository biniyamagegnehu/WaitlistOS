import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("\n=== FOUNDERS ===");
  const founders = await prisma.founder.findMany({
    select: { id: true, userId: true, email: true }
  });
  console.log(JSON.stringify(founders, null, 2));

  console.log("\n=== AFFILIATES ===");
  const affiliates = await prisma.affiliate.findMany({
    include: { founder: { select: { id: true, email: true } } }
  });
  console.log(JSON.stringify(affiliates.map(a => ({
    ...a,
    commissionRate: String(a.commissionRate)
  })), null, 2));

  console.log("\n=== AFFILIATE CLICKS (all) ===");
  const clicks = await prisma.affiliateClick.findMany({ orderBy: { createdAt: 'desc' } });
  console.log(JSON.stringify(clicks, null, 2));

  console.log("\n=== AFFILIATE ATTRIBUTIONS ===");
  const attributions = await prisma.affiliateAttribution.findMany();
  console.log(JSON.stringify(attributions, null, 2));

  console.log("\n=== AFFILIATE CONVERSIONS ===");
  const conversions = await prisma.affiliateConversion.findMany();
  console.log(JSON.stringify(conversions, null, 2));

  console.log("\n=== AFFILIATE COMMISSIONS ===");
  const commissions = await prisma.affiliateCommission.findMany();
  console.log(JSON.stringify(commissions.map(c => ({
    ...c,
    amount: String(c.amount),
    commissionRate: String(c.commissionRate)
  })), null, 2));

  console.log("\n=== SUBSCRIPTIONS (paid/active) ===");
  const subs = await prisma.subscription.findMany({
    where: { planCode: { not: 'FREE' } },
    select: {
      id: true, userId: true, planCode: true, status: true, createdAt: true,
      founder: { select: { id: true, email: true } }
    }
  });
  console.log(JSON.stringify(subs, null, 2));

  console.log("\n=== PAYMENTS (success) ===");
  const payments = await prisma.payment.findMany({
    where: { paymentStatus: 'SUCCESS' },
    select: {
      id: true, userId: true, planCode: true, paymentStatus: true,
      amount: true, createdAt: true
    },
    take: 10
  });
  console.log(JSON.stringify(payments.map(p => ({...p, amount: String(p.amount)})), null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
