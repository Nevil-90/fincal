-- Adds the wallet_entries table (Cash / Online wallet movements).
-- Purely additive: creates one new table + indexes + FK. No existing table or row is touched.
-- Idempotent: safe to run more than once.

CREATE TABLE IF NOT EXISTS "wallet_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fromWallet" TEXT,
    "toWallet" TEXT,
    "wallet" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "previousBalance" DECIMAL(65,30),
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "wallet_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "wallet_entries_userId_deletedAt_idx" ON "wallet_entries"("userId", "deletedAt");
CREATE INDEX IF NOT EXISTS "wallet_entries_userId_createdAt_idx" ON "wallet_entries"("userId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wallet_entries_userId_fkey') THEN
    ALTER TABLE "wallet_entries"
      ADD CONSTRAINT "wallet_entries_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
