import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Inspecting Production Database State...\n');

  try {
    // 1. Transaction table analysis
    const totalTransactions = await prisma.transaction.count();
    console.log(`📊 Total Transactions: ${totalTransactions}`);

    const rawTxInfo = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      ORDER BY ordinal_position;
    `);
    console.log('\n📋 Table "transactions" columns in PostgreSQL:');
    console.table(rawTxInfo);

    const hasDescription = rawTxInfo.some(c => c.column_name === 'description');
    const hasTitle = rawTxInfo.some(c => c.column_name === 'title');
    const hasNotes = rawTxInfo.some(c => c.column_name === 'notes');

    console.log(`- has 'description' column: ${hasDescription}`);
    console.log(`- has 'title' column: ${hasTitle}`);
    console.log(`- has 'notes' column: ${hasNotes}`);

    if (hasDescription) {
      const nullOrEmptyDesc = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*)::int as count 
        FROM "transactions" 
        WHERE "description" IS NULL OR TRIM("description") = '';
      `);
      console.log(`- transactions with NULL or blank description: ${nullOrEmptyDesc[0].count}`);

      const sampleDesc = await prisma.$queryRawUnsafe(`
        SELECT "id", "type", "amount", "category", "description", "date" 
        FROM "transactions" 
        ORDER BY "createdAt" DESC 
        LIMIT 5;
      `);
      console.log('\n📝 Sample Recent Transactions:');
      console.table(sampleDesc);
    }

    // 2. Table-by-table record counts across the database
    console.log('\n📊 Row Counts Across All Database Tables:');
    const tableCounts = {};
    const tables = [
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

    for (const t of tables) {
      try {
        if (prisma[t]) {
          tableCounts[t] = await prisma[t].count();
        }
      } catch (err) {
        tableCounts[t] = `Error: ${err.message}`;
      }
    }
    console.table(tableCounts);

  } catch (error) {
    console.error('❌ Database inspection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
