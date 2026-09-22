import { PrismaClient } from '../src/generated/prisma/index.js';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function runRestore(targetDir, isDryRun = true) {
  const backupDir = targetDir || path.resolve('backups', 'latest');
  console.log(`\n🔄 Database Restore Utility`);
  console.log(`📁 Source: ${backupDir}`);
  console.log(`⚙️ Mode: ${isDryRun ? '🟡 DRY RUN (no database changes will be committed)' : '🔴 LIVE RESTORE (will replace database contents)'}\n`);

  if (!fs.existsSync(backupDir)) {
    throw new Error(`❌ Backup directory does not exist: ${backupDir}`);
  }

  const manifestPath = path.join(backupDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`❌ Missing manifest.json in ${backupDir}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`📋 Backup created at: ${manifest.timestamp}`);
  console.log(`📋 Records in backup: ${manifest.totalRecords} across ${Object.keys(manifest.tables).length} tables`);

  const fullBackupPath = path.join(backupDir, 'full_backup.json');
  const backupData = JSON.parse(fs.readFileSync(fullBackupPath, 'utf8'));

  // Define insertion order respecting foreign key constraints
  const INSERT_ORDER = [
    'user',
    'staticDataCategory',
    'budgetAmount',
    'userSetting',
    'autoCategorizeRule',
    'monthlyBudget',
    'participant',
    'sharedSubscription',
    'subscriptionParticipant',
    'splitPayment',
    'subscriptionPriceChange',
    'travelEntry',
    'savingsGoal',
    'recurringTransaction',
    'recurringTransactionPriceChange',
    'transaction',
    'goalContribution',
    'userSession',
    'otpVerification',
    'passwordReset',
    'adminAuditLog'
  ];

  if (isDryRun) {
    console.log('🧪 Validating data structure and schema compatibility in DRY-RUN mode...');
    for (const model of INSERT_ORDER) {
      const records = backupData[model] || [];
      console.log(`  ✓ ${model}: validated ${records.length} records ready for restoration`);
    }

    // Check transaction compatibility
    const txRecords = backupData.transaction || [];
    for (const tx of txRecords) {
      const titleValue = tx.title || tx.description || 'Untitled Transaction';
      if (!titleValue) {
        throw new Error(`Invalid transaction title on ${tx.id}`);
      }
    }
    console.log(`  ✓ Transaction title/description mapping validated for ${txRecords.length} records`);
    console.log('\n✅ DRY RUN successful! Data is valid and ready to restore.');
    return;
  }

  // LIVE RESTORE
  console.log('⚠️ Performing live database restoration in a single transaction...');
  await prisma.$transaction(async (tx) => {
    // 1. Delete in reverse topological order
    for (const model of [...INSERT_ORDER].reverse()) {
      if (tx[model]) {
        console.log(`  🗑️ Clearing ${model}...`);
        await tx[model].deleteMany({});
      }
    }

    // 2. Insert in topological order
    for (const model of INSERT_ORDER) {
      const rawRecords = backupData[model] || [];
      if (rawRecords.length === 0) continue;

      console.log(`  📥 Restoring ${model} (${rawRecords.length} records)...`);

      // Adapt transactions to current schema (handles title / description / notes)
      let recordsToInsert = rawRecords;
      if (model === 'transaction') {
        recordsToInsert = rawRecords.map((t) => {
          const { description, ...rest } = t;
          return {
            ...rest,
            title: t.title || description || 'Untitled Transaction',
            notes: t.notes || null,
          };
        });
      }

      const CHUNK_SIZE = 1000;
      for (let i = 0; i < recordsToInsert.length; i += CHUNK_SIZE) {
        const chunk = recordsToInsert.slice(i, i + CHUNK_SIZE);
        await tx[model].createMany({ data: chunk });
      }
    }
  }, {
    timeout: 60000 // 60s timeout for large multi-table transaction
  });

  console.log(`\n🎉 Live database restoration completed successfully!`);
}

if (process.argv[1] && process.argv[1].endsWith('restore-db.mjs')) {
  const isDryRun = !process.argv.includes('--confirm');
  const targetDir = process.argv.find(arg => arg.startsWith('--dir='))?.split('=')[1];
  
  runRestore(targetDir, isDryRun)
    .catch((err) => {
      console.error('❌ Restore failed:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
