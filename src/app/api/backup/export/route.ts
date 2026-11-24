import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Middleware verifies the JWT cookie and passes user identity in headers
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = { id: userId }

    const [
      transactions,
      savingsGoals,
      goalContributions,
      recurringTransactions,
      recurringPriceChanges,
      monthlyBudgets,
      travelEntries,
      staticDataCategories,
      budgetAmounts,
      userSettings,
      autoCategorizeRules
    ] = await Promise.all([
      prisma.transaction.findMany({ where: { userId: user.id } }),
      prisma.savingsGoal.findMany({ where: { userId: user.id } }),
      prisma.goalContribution.findMany({ where: { goal: { userId: user.id } } }),
      prisma.recurringTransaction.findMany({ where: { userId: user.id } }),
      prisma.recurringTransactionPriceChange.findMany({ where: { recurringTransaction: { userId: user.id } } }),
      prisma.monthlyBudget.findMany({ where: { userId: user.id } }),
      prisma.travelEntry.findMany({ where: { userId: user.id } }),
      prisma.staticDataCategory.findMany({ where: { userId: user.id } }),
      prisma.budgetAmount.findMany({ where: { userId: user.id } }),
      prisma.userSetting.findMany({ where: { userId: user.id } }),
      prisma.autoCategorizeRule.findMany({ where: { userId: user.id } })
    ])

    const backupData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        userId: user.id
      },
      data: {
        transactions,
        savingsGoals,
        goalContributions,
        recurringTransactions,
        recurringPriceChanges,
        monthlyBudgets,
        travelEntries,
        staticDataCategories,
        budgetAmounts,
        userSettings,
        autoCategorizeRules
      }
    }

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
    const filename = `finacal_backup_${dateStr}_${timeStr}.json`

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export Error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
