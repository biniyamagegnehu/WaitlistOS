import { PrismaClient, PaymentProvider, PaymentAccountStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ override: true });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting migration...');

  // Note: we'll add the new columns manually via raw SQL first so the current client doesn't complain,
  // or we can just alter table before running the updates if we need to.
  // Actually, wait - if we add 'clickCount' and 'preferredPayoutProvider' to the schema now, we can't use the current client.
  // BUT we can use $executeRaw for the new columns! Let's alter the tables first in raw SQL.

  console.log('Adding new columns to affiliates table...');
  try {
    await prisma.$executeRaw`ALTER TABLE "affiliates" ADD COLUMN "clickCount" INTEGER NOT NULL DEFAULT 0;`;
    await prisma.$executeRaw`ALTER TABLE "affiliates" ADD COLUMN "preferredPayoutProvider" TEXT;`;
  } catch (e: any) {
    console.log('Columns might already exist:', e.message);
  }

  // 1. Migrate link clickCounts to Affiliate
  console.log('Migrating Affiliate Links...');
  const links = await prisma.affiliateLink.findMany();
  for (const link of links) {
    if (link.clickCount > 0) {
      await prisma.$executeRaw`UPDATE "affiliates" SET "clickCount" = "clickCount" + ${link.clickCount} WHERE id = ${link.affiliateId}`;
    }
  }
  console.log(`Migrated ${links.length} Affiliate Links.`);

  // 2. Migrate AffiliatePayoutAccounts to central PaymentAccounts
  console.log('Migrating Affiliate Payout Accounts...');
  const affiliateAccounts = await prisma.affiliatePayoutAccount.findMany({
    include: { affiliate: true },
  });

  for (const acc of affiliateAccounts) {
    // Check if founder already has this provider connected centrally
    let paymentAccount = await prisma.paymentAccount.findUnique({
      where: {
        founderId_provider: {
          founderId: acc.affiliate.founderId,
          provider: acc.provider,
        },
      },
    });

    if (!paymentAccount) {
      let centralStatus: PaymentAccountStatus = PaymentAccountStatus.NOT_CONNECTED;
      if (acc.status === 'ACTIVE') centralStatus = PaymentAccountStatus.ACTIVE;
      else if (acc.status === 'PENDING') centralStatus = PaymentAccountStatus.PENDING;
      else if (acc.status === 'ACTION_REQUIRED') centralStatus = PaymentAccountStatus.ACTION_REQUIRED;
      else if (acc.status === 'DISCONNECTED') centralStatus = PaymentAccountStatus.DISCONNECTED;
      else if (acc.status === 'ERROR') centralStatus = PaymentAccountStatus.ERROR;
      console.log(`Creating missing PaymentAccount for founder ${acc.affiliate.founderId} (provider: ${acc.provider})`);
      paymentAccount = await prisma.paymentAccount.create({
        data: {
          founderId: acc.affiliate.founderId,
          provider: acc.provider,
          providerAccountId: acc.providerAccountId,
          status: centralStatus,
          metadata: acc.metadata || undefined,
        },
      });
    }

    // 3. Update any AffiliatePayouts that point to this account to point to the central one
    console.log(`Updating payouts pointing to account ${acc.id} -> ${paymentAccount.id}`);
    await prisma.$executeRaw`UPDATE "affiliate_payouts" SET "payoutAccountId" = ${paymentAccount.id} WHERE "payoutAccountId" = ${acc.id}`;
    
    // Also set preferred provider for the affiliate
    await prisma.$executeRaw`UPDATE "affiliates" SET "preferredPayoutProvider" = ${acc.provider} WHERE id = ${acc.affiliate.id}`;
  }
  
  console.log(`Migrated ${affiliateAccounts.length} Affiliate Payout Accounts.`);
  console.log('Migration complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
