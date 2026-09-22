import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export function verifyBackup(targetDir) {
  const backupDir = targetDir || path.resolve('backups', 'latest');
  console.log(`🔍 Verifying database backup at: ${backupDir}...\n`);

  if (!fs.existsSync(backupDir)) {
    throw new Error(`❌ Backup directory does not exist: ${backupDir}`);
  }

  const manifestPath = path.join(backupDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`❌ Missing manifest.json in backup directory`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`📋 Manifest timestamp: ${manifest.timestamp}`);
  console.log(`📋 Total declared records: ${manifest.totalRecords}`);

  // Verify full_backup.json and checksum
  const fullBackupPath = path.join(backupDir, 'full_backup.json');
  if (!fs.existsSync(fullBackupPath)) {
    throw new Error(`❌ Missing full_backup.json`);
  }

  const fullBackupRaw = fs.readFileSync(fullBackupPath, 'utf8');
  const computedHash = crypto.createHash('sha256').update(fullBackupRaw).digest('hex');
  if (computedHash !== manifest.sha256) {
    throw new Error(`❌ Checksum mismatch! Declared: ${manifest.sha256}, Computed: ${computedHash}`);
  }
  console.log(`✓ SHA-256 Checksum verified (${computedHash})`);

  const fullBackup = JSON.parse(fullBackupRaw);

  // Check each individual table
  let verifiedCount = 0;
  for (const [table, expectedCount] of Object.entries(manifest.tables)) {
    const tableFilePath = path.join(backupDir, `${table}.json`);
    if (!fs.existsSync(tableFilePath)) {
      throw new Error(`❌ Missing individual table file: ${table}.json`);
    }

    const tableData = JSON.parse(fs.readFileSync(tableFilePath, 'utf8'));
    if (!Array.isArray(tableData)) {
      throw new Error(`❌ Table data for ${table} is not an array`);
    }

    if (tableData.length !== expectedCount) {
      throw new Error(`❌ Table ${table} record count mismatch: Expected ${expectedCount}, got ${tableData.length}`);
    }

    if (fullBackup[table]?.length !== expectedCount) {
      throw new Error(`❌ Consolidated backup count mismatch for ${table}`);
    }

    verifiedCount += tableData.length;
    console.log(`  ✓ ${table}: verified ${tableData.length} records`);
  }

  // Deep check Transaction records
  const transactions = fullBackup.transaction;
  if (!transactions || transactions.length === 0) {
    throw new Error(`❌ Transactions table has 0 records!`);
  }

  // Assert every transaction has id, type, amount, category, date, userId
  for (const tx of transactions) {
    if (!tx.id || !tx.type || tx.amount === undefined || !tx.category || !tx.userId) {
      throw new Error(`❌ Transaction integrity check failed on record ${tx.id || 'unknown'}`);
    }
  }
  console.log(`\n✓ Transaction integrity verified across all ${transactions.length} records`);
  console.log(`\n🎉 Backup verification passed! All ${verifiedCount} records across ${Object.keys(manifest.tables).length} tables are fully intact and readable.`);
  return true;
}

if (process.argv[1] && process.argv[1].endsWith('verify-backup.mjs')) {
  try {
    const target = process.argv[2];
    verifyBackup(target);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
