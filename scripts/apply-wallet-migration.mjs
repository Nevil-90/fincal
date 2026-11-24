// Applies prisma/migrations/20261124120000_add_wallet_entries/migration.sql through Prisma Client.
// (The Prisma CLI's schema engine hangs on Supabase's transaction pooler; the query engine works.)
// The SQL only CREATES things (IF NOT EXISTS) — no existing table or row is touched. Safe to re-run.
//
//   node scripts/apply-wallet-migration.mjs
import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

const statements = [
  `CREATE TABLE IF NOT EXISTS "wallet_entries" (
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
  )`,
  `CREATE INDEX IF NOT EXISTS "wallet_entries_userId_deletedAt_idx" ON "wallet_entries"("userId", "deletedAt")`,
  `CREATE INDEX IF NOT EXISTS "wallet_entries_userId_createdAt_idx" ON "wallet_entries"("userId", "createdAt")`,
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wallet_entries_userId_fkey') THEN
      ALTER TABLE "wallet_entries"
        ADD CONSTRAINT "wallet_entries_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
]

try {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL lock_timeout = '10s'`)
    for (const sql of statements) await tx.$executeRawUnsafe(sql)
  }, { timeout: 60000 })
  const cols = await prisma.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='wallet_entries' ORDER BY ordinal_position`)
  const idx = await prisma.$queryRawUnsafe(`SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename='wallet_entries' ORDER BY 1`)
  const fk = await prisma.$queryRawUnsafe(`SELECT conname FROM pg_constraint WHERE conrelid = 'public.wallet_entries'::regclass AND contype IN ('p','f') ORDER BY 1`)
  console.log('✅ wallet_entries ready')
  console.log('   columns:', cols.map(c => c.column_name).join(', '))
  console.log('   indexes:', idx.map(i => i.indexname).join(', '))
  console.log('   constraints:', fk.map(f => f.conname).join(', '))
} catch (e) {
  console.error('❌ Migration failed (transaction rolled back, nothing changed):', e.message)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
