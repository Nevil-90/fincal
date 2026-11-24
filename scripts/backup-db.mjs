import { PrismaClient } from '../src/generated/prisma/index.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

const MODELS = [
  'user',
  'transaction',
  'savingsGoal',
  'goalContribution',
  'recurringTransaction',
  'recurringTransactionPriceChange',
  'monthlyBudget',
  'participant',
  'sharedSubscription',
  'subscriptionParticipant',
  'splitPayment',
  'subscriptionPriceChange',
  'travelEntry',
  'staticDataCategory',
  'budgetAmount',
  'userSetting',
  'autoCategorizeRule',
  'userSession',
  'otpVerification',
  'passwordReset',
  'adminAuditLog'
];

export async function runBackup(customBackupDir) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = customBackupDir || path.resolve('backups', timestamp);
  const latestDir = path.resolve('backups', 'latest');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`📦 Starting full database backup to: ${backupDir}...`);
  const fullBackup = {};
  const manifest = {
    timestamp: new Date().toISOString(),
    backupDir,
    tables: {},
    totalRecords: 0
  };

  try {
    for (const model of MODELS) {
      if (!prisma[model]) {
        console.warn(`⚠️ Model "${model}" not found on PrismaClient, skipping.`);
        continue;
      }
      
      const records = await prisma[model].findMany();
      fullBackup[model] = records;
      manifest.tables[model] = records.length;
      manifest.totalRecords += records.length;

      // Write individual table file
      fs.writeFileSync(
        path.join(backupDir, `${model}.json`),
        JSON.stringify(records, null, 2)
      );
      console.log(`  ✓ ${model}: ${records.length} records backed up`);
    }

    // Write consolidated full backup
    const fullBackupJson = JSON.stringify(fullBackup, null, 2);
    fs.writeFileSync(path.join(backupDir, 'full_backup.json'), fullBackupJson);

    // Compute checksum
    const hash = crypto.createHash('sha256').update(fullBackupJson).digest('hex');
    manifest.sha256 = hash;

    // Write manifest
    fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    // Mirror to backups/latest
    if (!fs.existsSync(latestDir)) {
      fs.mkdirSync(latestDir, { recursive: true });
    }
    for (const file of fs.readdirSync(backupDir)) {
      fs.copyFileSync(path.join(backupDir, file), path.join(latestDir, file));
    }

    // Also mirror to legacy prisma/backup.json for backward compatibility
    const legacyPath = path.resolve('prisma', 'backup.json');
    fs.writeFileSync(legacyPath, fullBackupJson);

    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📊 Total tables backed up: ${Object.keys(manifest.tables).length}`);
    console.log(`📊 Total records backed up: ${manifest.totalRecords}`);
    console.log(`📁 Backup location: ${backupDir}`);
    console.log(`📁 Latest mirror: ${latestDir}`);
    console.log(`🔐 SHA-256 Checksum: ${manifest.sha256}`);

    return { backupDir, manifest };
  } catch (error) {
    console.error('❌ Database backup failed:', error);
    throw error;
  }
}

// Auto-run if executed as main
if (process.argv[1] && process.argv[1].endsWith('backup-db.mjs')) {
  runBackup()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
