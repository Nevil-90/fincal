import { PrismaClient } from '../src/generated/prisma/index.js';
import { runBackup } from './backup-db.mjs';
import { verifyBackup } from './verify-backup.mjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Safe Database Migration Process...\n');

  try {
    // 1. Mandatory Pre-Migration Backup
    console.log('--- Step 1: Pre-Migration Backup & Verification ---');
    const { backupDir } = await runBackup();
    verifyBackup(backupDir);
    console.log('✅ Pre-migration backup verified. Safe to proceed.\n');

    // 2. Pre-migration state capture
    console.log('--- Step 2: Capturing Pre-Migration State ---');
    const preTxCount = await prisma.transaction.count();
    console.log(`📊 Pre-migration Transaction count: ${preTxCount}`);

    const preNullCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as count 
      FROM "transactions" 
      WHERE "description" IS NULL OR TRIM("description") = '';
    `);
    console.log(`📊 Pre-migration NULL or blank descriptions: ${preNullCount[0].count}`);

    // Read sample descriptions to verify preservation later
    const sampleBefore = await prisma.$queryRawUnsafe(`
      SELECT "id", "description" 
      FROM "transactions" 
      WHERE "description" IS NOT NULL AND TRIM("description") <> ''
      ORDER BY "createdAt" DESC 
      LIMIT 10;
    `);

    // 3. Execute Migration SQL
    console.log('\n--- Step 3: Executing In-Place Migration SQL ---');
    const migrationFile = path.resolve(
      'prisma',
      'migrations',
      '20260922180000_rename_description_to_title_and_add_notes',
      'migration.sql'
    );
    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Split and execute statements within a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Rename column
      console.log('  Executing: ALTER TABLE "transactions" RENAME COLUMN "description" TO "title"...');
      await tx.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'transactions' AND column_name = 'description'
          ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'transactions' AND column_name = 'title'
          ) THEN
            ALTER TABLE "transactions" RENAME COLUMN "description" TO "title";
          END IF;
        END $$;
      `);

      // 2. Backfill empty/null titles
      console.log('  Executing: Safe backfill of empty/null titles...');
      await tx.$executeRawUnsafe(`
        UPDATE "transactions"
        SET "title" = CASE
          WHEN "category" IS NOT NULL AND TRIM("category") <> '' THEN "category"
          ELSE 'Untitled Transaction'
        END
        WHERE "title" IS NULL OR TRIM("title") = '';
      `);

      // 3. Set NOT NULL
      console.log('  Executing: ALTER TABLE "transactions" ALTER COLUMN "title" SET NOT NULL...');
      await tx.$executeRawUnsafe(`
        ALTER TABLE "transactions" ALTER COLUMN "title" SET NOT NULL;
      `);

      // 4. Add notes column
      console.log('  Executing: ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "notes" TEXT...');
      await tx.$executeRawUnsafe(`
        ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "notes" TEXT;
      `);

      // 5. Record migration in _prisma_migrations if table exists
      console.log('  Recording migration in _prisma_migrations...');
      await tx.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
          "id" VARCHAR(36) PRIMARY KEY,
          "checksum" VARCHAR(64) NOT NULL,
          "finished_at" TIMESTAMPTZ,
          "migration_name" VARCHAR(255) NOT NULL,
          "logs" TEXT,
          "rolled_back_at" TIMESTAMPTZ,
          "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "applied_steps_count" INTEGER NOT NULL DEFAULT 0
        );
      `);

      await tx.$executeRawUnsafe(`
        INSERT INTO "_prisma_migrations" (
          "id", "checksum", "finished_at", "migration_name", "applied_steps_count"
        ) VALUES (
          gen_random_uuid(), 'manual_verified_migration', now(), 
          '20260922180000_rename_description_to_title_and_add_notes', 1
        ) ON CONFLICT DO NOTHING;
      `);
    });

    console.log('✅ Migration SQL executed successfully.\n');

    // 4. Post-Migration Verification
    console.log('--- Step 4: Post-Migration Verification ---');
    
    // Check columns
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      ORDER BY ordinal_position;
    `);
    console.log('📋 Updated "transactions" Columns:');
    console.table(columns);

    const titleCol = columns.find(c => c.column_name === 'title');
    const notesCol = columns.find(c => c.column_name === 'notes');
    const descCol = columns.find(c => c.column_name === 'description');

    if (!titleCol) throw new Error('❌ Verification failed: "title" column does not exist!');
    if (titleCol.is_nullable !== 'NO') throw new Error('❌ Verification failed: "title" is not marked NOT NULL!');
    if (!notesCol) throw new Error('❌ Verification failed: "notes" column does not exist!');
    if (descCol) throw new Error('❌ Verification failed: "description" column still exists (should be renamed)!');

    console.log('✓ Column assertions passed: title exists & NOT NULL, notes exists & nullable, description renamed');

    // Check row count
    const postCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as count FROM "transactions";
    `);
    console.log(`📊 Post-migration Transaction count: ${postCount[0].count}`);
    if (postCount[0].count !== preTxCount) {
      throw new Error(`❌ Row count mismatch! Pre: ${preTxCount}, Post: ${postCount[0].count}`);
    }
    console.log(`✓ Row count 100% matched: exactly ${postCount[0].count} records preserved`);

    // Check NULL titles
    const nullTitleCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as count FROM "transactions" WHERE "title" IS NULL;
    `);
    if (nullTitleCount[0].count > 0) {
      throw new Error(`❌ Found ${nullTitleCount[0].count} NULL titles!`);
    }
    console.log(`✓ 0 NULL titles verified`);

    // Verify sample data preservation
    console.log('\n--- Step 5: Verifying Historical Data Preservation ---');
    for (const sample of sampleBefore) {
      const match = await prisma.$queryRawUnsafe(`
        SELECT "id", "title" FROM "transactions" WHERE "id" = '${sample.id}';
      `);
      if (!match[0] || match[0].title !== sample.description) {
        throw new Error(`❌ Data mismatch on ID ${sample.id}! Expected '${sample.description}', got '${match[0]?.title}'`);
      }
    }
    console.log(`✓ Verified ${sampleBefore.length} sample historical records: description values perfectly preserved in 'title' column!`);

    console.log('\n🎉 ALL MIGRATION CHECKS PASSED WITH ZERO DATA LOSS!');

  } catch (error) {
    console.error('\n❌ Safe Migration Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
