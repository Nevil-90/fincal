import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = { id: userId }

    const body = await request.json()
    const { data } = body

    if (!data) {
      return NextResponse.json({ error: 'Invalid backup file format' }, { status: 400 })
    }

    // Run within a transaction to ensure all or nothing
    await prisma.$transaction(async (tx) => {
      // 1. Delete existing data for the user in reverse topological order
      await tx.goalContribution.deleteMany({ where: { goal: { userId: user.id } } })
      await tx.transaction.deleteMany({ where: { userId: user.id } })
      await tx.recurringTransactionPriceChange.deleteMany({ where: { recurringTransaction: { userId: user.id } } })
      await tx.recurringTransaction.deleteMany({ where: { userId: user.id } })
      await tx.savingsGoal.deleteMany({ where: { userId: user.id } })
      await tx.monthlyBudget.deleteMany({ where: { userId: user.id } })
      await tx.travelEntry.deleteMany({ where: { userId: user.id } })
      await tx.staticDataCategory.deleteMany({ where: { userId: user.id } })
      await tx.budgetAmount.deleteMany({ where: { userId: user.id } })
      await tx.userSetting.deleteMany({ where: { userId: user.id } })
      await tx.autoCategorizeRule.deleteMany({ where: { userId: user.id } })

      // Helper to clean up data before insert (remove user-specific IDs to prevent cross-user pollution if restored by someone else, though we rely on unique IDs in the backup)
      // Since it's the SAME user's backup, we can safely insert with original IDs to maintain relations.
      
      const insertWithUserId = (items: any[]) => items?.map(({ id, ...rest }) => ({ id, ...rest, userId: user.id })) || []

      const chunkInsert = async (model: any, items: any[]) => {
        const CHUNK_SIZE = 2000;
        for (let i = 0; i < items.length; i += CHUNK_SIZE) {
          await model.createMany({ data: items.slice(i, i + CHUNK_SIZE) });
        }
      }

      // 2. Insert data in topological order
      if (data.staticDataCategories?.length) await chunkInsert(tx.staticDataCategory, insertWithUserId(data.staticDataCategories))
      if (data.budgetAmounts?.length) await chunkInsert(tx.budgetAmount, insertWithUserId(data.budgetAmounts))
      if (data.userSettings?.length) await chunkInsert(tx.userSetting, insertWithUserId(data.userSettings))
      if (data.autoCategorizeRules?.length) await chunkInsert(tx.autoCategorizeRule, insertWithUserId(data.autoCategorizeRules))
      if (data.monthlyBudgets?.length) await chunkInsert(tx.monthlyBudget, insertWithUserId(data.monthlyBudgets))
      if (data.travelEntries?.length) await chunkInsert(tx.travelEntry, insertWithUserId(data.travelEntries))
      
      if (data.savingsGoals?.length) await chunkInsert(tx.savingsGoal, insertWithUserId(data.savingsGoals))
      if (data.recurringTransactions?.length) await chunkInsert(tx.recurringTransaction, insertWithUserId(data.recurringTransactions))
      
      if (data.recurringPriceChanges?.length) await chunkInsert(tx.recurringTransactionPriceChange, data.recurringPriceChanges)
      
      
      if (data.transactions?.length) await chunkInsert(tx.transaction, insertWithUserId(data.transactions))
      
      if (data.goalContributions?.length) await chunkInsert(tx.goalContribution, data.goalContributions)
    }, {
      maxWait: 10000,
      timeout: 60000
    })

    return NextResponse.json({ success: true, message: 'Data restored successfully' })
  } catch (error) {
    console.error('Import Error:', error)
    return NextResponse.json({ error: 'Failed to restore data. The file might be corrupted or incompatible.' }, { status: 500 })
  }
}
