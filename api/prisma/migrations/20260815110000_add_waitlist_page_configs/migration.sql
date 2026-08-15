CREATE TABLE "waitlist_page_configs" (
  "id" TEXT NOT NULL,
  "waitlistId" TEXT NOT NULL,
  "draftConfig" JSONB NOT NULL,
  "publishedConfig" JSONB,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "waitlist_page_configs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "waitlist_page_configs_waitlistId_key" ON "waitlist_page_configs"("waitlistId");
ALTER TABLE "waitlist_page_configs" ADD CONSTRAINT "waitlist_page_configs_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
