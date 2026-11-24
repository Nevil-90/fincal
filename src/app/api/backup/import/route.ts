import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { localToUtcMidnight } from '@/lib/recurring-date-utils'

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
      // Wallet (Cash / Online) entries are only replaced when the backup contains them,
      // so restoring an older backup never wipes balances set up after it was taken.
      const hasWalletEntries = Array.isArray(data.walletEntries)
      if (hasWalletEntries) await tx.walletEntry.deleteMany({ where: { userId: user.id } })

      // Payment-method spelling: compare case/space-insensitively and keep ONE spelling per
      // method (cash is always "Cash"), so "CASH" / "cash " in old files can't create duplicates.
      const pmKey = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()
      const pmCanonical = new Map<string, string>()
      const registerPm = (name: unknown) => {
        if (typeof name !== 'string') return
        const k = pmKey(name)
        if (k && !pmCanonical.has(k)) pmCanonical.set(k, k === 'cash' ? 'Cash' : name.trim().replace(/\s+/g, ' '))
      }
      const canonPm = (value: unknown) => {
        if (typeof value !== 'string' || !value.trim()) return value ?? null
        registerPm(value)
        return pmCanonical.get(pmKey(value))
      }
      ;(data.staticDataCategories || []).forEach((c: any) => { if (c?.type === 'payment_methods') registerPm(c.name) })

      const seenStatic = new Set<string>()
      const staticCategories = (data.staticDataCategories || [])
        .map((c: any) => (c?.type === 'payment_methods' ? { ...c, name: canonPm(c.name) } : c))
        .filter((c: any) => {
          const key = `${c?.type}|${c?.name}`
          if (seenStatic.has(key)) return false
          seenStatic.add(key)
          return true
        })

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
      if (staticCategories.length) await chunkInsert(tx.staticDataCategory, insertWithUserId(staticCategories))
      if (data.budgetAmounts?.length) await chunkInsert(tx.budgetAmount, insertWithUserId(data.budgetAmounts))
      if (data.userSettings?.length) await chunkInsert(tx.userSetting, insertWithUserId(data.userSettings))
      if (data.autoCategorizeRules?.length) await chunkInsert(tx.autoCategorizeRule, insertWithUserId(data.autoCategorizeRules))
      if (data.monthlyBudgets?.length) await chunkInsert(tx.monthlyBudget, insertWithUserId(data.monthlyBudgets))
      
      if (data.savingsGoals?.length) {
        const savingsGoalsToInsert = data.savingsGoals.map(({ id, ...rest }: any) => ({
          id,
          ...rest,
          category: rest.category || 'General',
          userId: user.id
        }))
        await chunkInsert(tx.savingsGoal, savingsGoalsToInsert)
      }

      if (data.recurringTransactions?.length) {
        const recurringToInsert = data.recurringTransactions.map(({ id, ...rest }: any) => ({
          id,
          ...rest,
          startDate: rest.startDate ? localToUtcMidnight(new Date(rest.startDate)) : undefined,
          nextDue: rest.nextDue ? localToUtcMidnight(new Date(rest.nextDue)) : undefined,
          paymentMethod: canonPm(rest.paymentMethod),
          userId: user.id
        }))
        await chunkInsert(tx.recurringTransaction, recurringToInsert)
      }

      if (data.recurringPriceChanges?.length) {
        const priceChangesToInsert = data.recurringPriceChanges.map(({ id, ...rest }: any) => ({
          id,
          ...rest,
          effectiveDate: rest.effectiveDate ? localToUtcMidnight(new Date(rest.effectiveDate)) : undefined,
        }))
        await chunkInsert(tx.recurringTransactionPriceChange, priceChangesToInsert)
      }

      if (data.transactions?.length) {
        const transactionsToInsert = data.transactions.map(({ id, description, ...rest }: any) => ({
          id,
          ...rest,
          title: rest.title || description || 'Untitled Transaction',
          notes: rest.notes || null,
          date: rest.date ? localToUtcMidnight(new Date(rest.date)) : undefined,
          paymentMethod: canonPm(rest.paymentMethod),
          userId: user.id
        }))
        await chunkInsert(tx.transaction, transactionsToInsert)
      }

      // Travel entries reference transactions (transactionId FK), so they must be inserted after them.
      if (data.travelEntries?.length) await chunkInsert(tx.travelEntry, insertWithUserId(data.travelEntries))
      if (data.goalContributions?.length) await chunkInsert(tx.goalContribution, data.goalContributions)
      if (hasWalletEntries && data.walletEntries.length) await chunkInsert(tx.walletEntry, insertWithUserId(data.walletEntries))

      const allTransactions = [...(data.transactions || []), ...(data.recurringTransactions || [])]
      if (allTransactions.length > 0) {
        const uniqueCategories = new Map<string, { type: string, name: string }>()
        
        allTransactions.forEach((t: any) => {
          if (t.category && t.type) {
            const dbType = t.type === 'income' ? 'income_categories' : 'expense_categories'
            const key = `${dbType}-${t.category}`
            if (!uniqueCategories.has(key)) {
              uniqueCategories.set(key, { type: dbType, name: t.category })
            }
          }
          if (t.paymentMethod) {
            const pmName = canonPm(t.paymentMethod) as string
            const key = `payment_methods-${pmName}`
            if (!uniqueCategories.has(key)) {
              uniqueCategories.set(key, { type: 'payment_methods', name: pmName })
            }
          }
          if (t.source) {
            const key = `income_sources-${t.source}`
            if (!uniqueCategories.has(key)) {
              uniqueCategories.set(key, { type: 'income_sources', name: t.source })
            }
          }
        })

        if (uniqueCategories.size > 0) {
          const categoriesToInsert = Array.from(uniqueCategories.values()).map(c => ({
            ...c,
            userId: user.id,
            isActive: true
          }))
          
          await tx.staticDataCategory.createMany({
            data: categoriesToInsert,
            skipDuplicates: true
          })
        }
      }
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
