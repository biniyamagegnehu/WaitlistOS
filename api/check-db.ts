import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const clicks = await prisma.affiliateClick.findMany();
  const attributions = await prisma.affiliateAttribution.findMany();
  const conversions = await prisma.affiliateConversion.findMany();
  const commissions = await prisma.affiliateCommission.findMany();
  const affiliates = await prisma.affiliate.findMany();

  console.log("Affiliates:", affiliates);
  console.log("Clicks:", clicks);
  console.log("Attributions:", attributions);
  console.log("Conversions:", conversions);
  console.log("Commissions:", commissions);
}

main().catch(console.error).finally(() => prisma.$disconnect());
