-- Add valueType column to rewards table
ALTER TABLE "rewards" ADD COLUMN "valueType" TEXT DEFAULT 'fixed';
