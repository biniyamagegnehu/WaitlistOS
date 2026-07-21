-- Add company profile fields to founders table
ALTER TABLE "founders" ADD COLUMN "companyName" TEXT;
ALTER TABLE "founders" ADD COLUMN "industry" TEXT;
ALTER TABLE "founders" ADD COLUMN "companyDescription" TEXT;
ALTER TABLE "founders" ADD COLUMN "country" TEXT;
ALTER TABLE "founders" ADD COLUMN "teamSize" TEXT;
ALTER TABLE "founders" ADD COLUMN "companyLogo" TEXT;
ALTER TABLE "founders" ADD COLUMN "companyWebsite" TEXT;
ALTER TABLE "founders" ADD COLUMN "onboardingCompleted" BOOLEAN DEFAULT false;
ALTER TABLE "founders" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
