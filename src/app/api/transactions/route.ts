// Full CRUD for transactions with filtering, pagination, and optional
// opening-balance calculation. PATCH updates an existing transaction in place.
// DELETE is a soft-delete; transactions linked to a goal contribution are blocked.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const startTime = performance.now()
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const recurringId = searchParams.get('recurringId')
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '50', 10), 10000))
    const offset = (page - 1) * limit
    
    const category = searchParams.get('category')
    const type = searchParams.get('type') as 'income' | 'expense' | null
    const paymentMethod = searchParams.get('paymentMethod')
    const source = searchParams.get('source')
    const recurring = searchParams.get('recurring')
    const sortBy = searchParams.get('sortBy') || 'date-desc'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const search = searchParams.get('search')?.trim()
    const includeOpeningBalance = searchParams.get('includeOpeningBalance') === 'true'
    
    const monthParam = searchParams.get('month')
    const yearParam = searchParams.get('year')
    
    const whereClause: any = {
      userId: currentUserId,
      deletedAt: null
    }
    
    if (recurringId) {
      whereClause.recurringTransactionId = recurringId
    } else if (recurring && recurring !== 'all') {
      if (recurring === 'recurring' || recurring === 'yes') {
        whereClause.recurringTransactionId = { not: null }
      } else if (recurring === 'non-recurring' || recurring === 'no') {
        whereClause.recurringTransactionId = null
      }
    }

    const isOneTimeSubscriptionParam = searchParams.get('isOneTimeSubscription')
    if (isOneTimeSubscriptionParam === 'true') {
      whereClause.isOneTimeSubscription = true
    } else if (isOneTimeSubscriptionParam === 'false') {
      whereClause.isOneTimeSubscription = false
    }
    
    if (category === 'Goals') {
      const goalsCondition: any = {
        OR: [
          { category: 'Goals' },
          { goalContribution: { isNot: null } }
        ]
      }

      const goalCategory = searchParams.get('goalCategory')
      if (goalCategory && goalCategory !== 'all') {
        goalsCondition.goalContribution = {
          goal: {
            OR: [
              { category: { equals: goalCategory, mode: 'insensitive' } },
              { name: { equals: goalCategory, mode: 'insensitive' } }
            ]
          }
        }
      }

      if (!whereClause.AND) whereClause.AND = []
      whereClause.AND.push(goalsCondition)
    } else if (category && category !== 'all') {
      whereClause.category = category
      whereClause.goalContribution = null
    }
    
    if (type) {
      whereClause.type = type
    }
    
    if (paymentMethod && paymentMethod !== 'all') {
      whereClause.paymentMethod = paymentMethod
    }

    if (source && source !== 'all') {
      whereClause.source = source
    }
    
    if (startDate || endDate) {
      whereClause.date = {}
      if (startDate) {
        const d = new Date(startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`)
        if (!isNaN(d.getTime())) whereClause.date.gte = d
        else return NextResponse.json({ success: false, error: 'Invalid startDate', code: 'INVALID_START_DATE' }, { status: 400 })
      }
      if (endDate) {
        const d = new Date(endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`)
        if (!isNaN(d.getTime())) whereClause.date.lte = d
        else return NextResponse.json({ success: false, error: 'Invalid endDate', code: 'INVALID_END_DATE' }, { status: 400 })
      }
    } else if (monthParam && yearParam) {
      const year = parseInt(yearParam, 10)
      const month = parseInt(monthParam, 10) - 1
      if (isNaN(year) || isNaN(month)) return NextResponse.json({ success: false, error: 'Invalid month or year', code: 'INVALID_PERIOD' }, { status: 400 })
      const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
      const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))
      
      whereClause.date = {
        gte: startOfMonth,
        lte: endOfMonth
      }
    } else if (yearParam && !monthParam) {
      const year = parseInt(yearParam, 10)
      if (isNaN(year)) return NextResponse.json({ success: false, error: 'Invalid year', code: 'INVALID_YEAR' }, { status: 400 })
      const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
      const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
      
      whereClause.date = {
        gte: startOfYear,
        lte: endOfYear
      }
    }
    
    if (minAmount || maxAmount) {
      whereClause.amount = {}
      if (minAmount) {
        const min = parseFloat(minAmount)
        if (!isNaN(min)) whereClause.amount.gte = min
      }
      if (maxAmount) {
        const max = parseFloat(maxAmount)
        if (!isNaN(max)) whereClause.amount.lte = max
      }
    }
    
    if (search) {
      const searchCondition = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
          { paymentMethod: { contains: search, mode: 'insensitive' } },
          { source: { contains: search, mode: 'insensitive' } }
        ]
      }
      if (!whereClause.AND) whereClause.AND = []
      whereClause.AND.push(searchCondition)
    }

    // Determine database-level sort order
    let orderBy: any = [{ date: 'desc' }, { id: 'desc' }]
    switch (sortBy) {
      case 'date-asc':
        orderBy = [{ date: 'asc' }, { id: 'asc' }]
        break
      case 'amount-desc':
        orderBy = [{ amount: 'desc' }, { date: 'desc' }]
        break
      case 'amount-asc':
        orderBy = [{ amount: 'asc' }, { date: 'desc' }]
        break
      case 'title-asc':
        orderBy = [{ title: 'asc' }, { date: 'desc' }]
        break
      case 'title-desc':
        orderBy = [{ title: 'desc' }, { date: 'desc' }]
        break
      case 'category-asc':
        orderBy = [{ category: 'asc' }, { date: 'desc' }]
        break
      case 'category-desc':
        orderBy = [{ category: 'desc' }, { date: 'desc' }]
        break
      case 'date-desc':
      default:
        orderBy = [{ date: 'desc' }, { id: 'desc' }]
        break
    }
    
    const queries: Promise<any>[] = [
      prisma.transaction.count({ where: whereClause }),
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          recurringTransaction: {
            select: {
              id: true,
              description: true,
              frequency: true,
              isActive: true,
              isPaused: true
            }
          },
          travelEntry: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              startKm: true,
              endKm: true,
              amount: true,
              liters: true,
              description: true
            }
          },
          goalContribution: {
            select: {
              id: true,
              goalId: true,
              type: true,
              reason: true,
              amount: true,
              goal: {
                select: {
                  id: true,
                  name: true,
                  category: true
                }
              }
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: whereClause,
        _sum: { amount: true }
      })
    ]

    const calculateOpening = includeOpeningBalance && whereClause.date?.gte
    if (calculateOpening) {
      queries.push(
        prisma.transaction.groupBy({
          by: ['type'],
          where: { userId: currentUserId, deletedAt: null, date: { lt: whereClause.date?.gte } },
          _sum: { amount: true }
        })
      )
    }

    const results = await Promise.all(queries)
    
    const totalCount = results[0]
    const transactions = results[1]
    const summaryGrouped = results[2] || []
    
    let filteredIncome = 0
    let filteredExpense = 0
    summaryGrouped.forEach((g: any) => {
      const amt = Number(g._sum?.amount || 0)
      if (g.type === 'income') filteredIncome = amt
      if (g.type === 'expense') filteredExpense = amt
    })

    let openingBalance = 0
    if (calculateOpening && results[3]) {
      const openingGrouped = results[3]
      let openingIncome = 0
      let openingExpense = 0
      openingGrouped.forEach((g: any) => {
        if (g.type === 'income') openingIncome = Number(g._sum.amount || 0)
        if (g.type === 'expense') openingExpense = Number(g._sum.amount || 0)
      })
      openingBalance = openingIncome - openingExpense
    }
    
    const totalPages = Math.ceil(totalCount / limit) || 1
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1
    
    const sanitizedTransactions = transactions.map((t: any) => ({
      ...t,
      amount: typeof t.amount?.toNumber === 'function' ? t.amount.toNumber() : Number(t.amount),
      description: t.title || t.description || 'Untitled Transaction'
    }))

    const durationMs = Math.round(performance.now() - startTime)

    return NextResponse.json(
      {
        success: true,
        transactions: sanitizedTransactions,
        openingBalance,
        summary: {
          income: filteredIncome,
          expense: filteredExpense,
          net: filteredIncome - filteredExpense,
          totalCount
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        }
      },
      {
        status: 200,
        headers: {
          'Server-Timing': `db;dur=${durationMs}`,
          'X-Response-Time': `${durationMs}ms`,
          'X-Total-Count': String(totalCount),
          'X-Total-Pages': String(totalPages),
          'Cache-Control': 'private, no-cache, no-store, must-revalidate'
        }
      }
    )
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch transactions', code: 'FETCH_ERROR' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      type, 
      amount, 
      category, 
      title, 
      description, 
      notes, 
      paymentMethod, 
      source, 
      date, 
      recurringTransactionId,
      isOneTimeSubscription,
      subscriptionKind,
      recurringSchedule,
      fuelData,
      startKm,
      endKm,
      liters,
      fuelStartDate,
      goalId,
      goalAction,
      goalReason
    } = body

    const titleValue = (title !== undefined ? title : description)?.trim()

    if (!type || !amount || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a valid number greater than zero' }, { status: 400 })
    }

    let validDate = new Date()
    if (date) {
      const d = new Date(date)
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
      }
      validDate = d
    }

    // 1. FUEL FLOW (Centralized Fuel / Travel)
    const fuelPayload = fuelData || (startKm !== undefined && endKm !== undefined && liters !== undefined ? { startKm, endKm, liters, startDate: fuelStartDate } : null)
    if (category === 'Fuel' && fuelPayload) {
      if (fuelPayload.startKm !== undefined && fuelPayload.endKm !== undefined && fuelPayload.liters !== undefined) {
        const numStartKm = parseFloat(fuelPayload.startKm)
        const numEndKm = parseFloat(fuelPayload.endKm)
        const numLiters = parseFloat(fuelPayload.liters)

        if (numStartKm >= numEndKm) {
          return NextResponse.json({ error: 'End KM must be greater than Start KM' }, { status: 400 })
        }
        if (numLiters <= 0) {
          return NextResponse.json({ error: 'Fuel liters must be greater than zero' }, { status: 400 })
        }

        const kmTraveled = Number((numEndKm - numStartKm).toFixed(1))
        const efficiency = Number((kmTraveled / numLiters).toFixed(2))
        const ratePerLiter = Number((numericAmount / numLiters).toFixed(2))
        const fuelDesc = notes?.trim() || `Fuel: ${numLiters}L, ${kmTraveled}km, ${efficiency} km/L, ₹${ratePerLiter}/L`
        const fuelStart = fuelPayload.startDate ? new Date(fuelPayload.startDate) : new Date(validDate.getTime() - 24 * 60 * 60 * 1000)

        const finalTitle = titleValue || `Fuel (${kmTraveled} km)`

        const result = await prisma.$transaction(async (tx) => {
          const transaction = await tx.transaction.create({
            data: {
              type: 'expense',
              amount: numericAmount,
              category: 'Fuel',
              title: finalTitle,
              notes: fuelDesc,
              paymentMethod: paymentMethod || 'Cash',
              source: source || 'Fuel Log',
              date: validDate,
              isOneTimeSubscription: false,
              userId: currentUserId
            }
          })

          const travelEntry = await tx.travelEntry.create({
            data: {
              startDate: fuelStart,
              endDate: validDate,
              startKm: numStartKm,
              endKm: numEndKm,
              amount: numericAmount,
              liters: numLiters,
              description: fuelDesc,
              transactionId: transaction.id,
              userId: currentUserId
            }
          })

          return { ...transaction, description: transaction.title, travelEntry }
        })

        return NextResponse.json(result)
      }
    }

    // 2. GOALS FLOW (Centralized Goals: Deposit vs Withdrawal)
    if (category === 'Goals' && goalId) {
      const goal = await prisma.savingsGoal.findFirst({
        where: { id: goalId, userId: currentUserId, deletedAt: null }
      })
      if (!goal) {
        return NextResponse.json({ error: 'Savings goal not found or access denied' }, { status: 404 })
      }

      const isWithdrawal = (goalAction || type).toLowerCase() === 'withdrawal' || type === 'transfer'

      if (isWithdrawal) {
        if (numericAmount > Number(goal.currentAmount)) {
          return NextResponse.json({
            error: `Cannot withdraw ₹${numericAmount.toLocaleString()}. Available goal savings is ₹${Number(goal.currentAmount).toLocaleString()}.`
          }, { status: 400 })
        }

        const finalTitle = titleValue || `Withdrawal: ${goal.name}${goalReason ? ` (${goalReason})` : ''}`

        const result = await prisma.$transaction(async (tx) => {
          const transaction = await tx.transaction.create({
            data: {
              type: 'transfer', // ZERO distortion to income or expense
              amount: numericAmount,
              category: 'Goals',
              title: finalTitle,
              notes: goalReason || notes?.trim() || null,
              paymentMethod: paymentMethod || null,
              source: source || 'Goal Withdrawal',
              date: validDate,
              isOneTimeSubscription: false,
              userId: currentUserId
            }
          })

          const contribution = await tx.goalContribution.create({
            data: {
              goalId: goal.id,
              amount: numericAmount,
              type: 'withdrawal',
              reason: goalReason || notes?.trim() || null,
              transactionId: transaction.id,
              description: finalTitle,
              date: validDate
            }
          })

          const updatedGoal = await tx.savingsGoal.update({
            where: { id: goal.id },
            data: {
              currentAmount: { decrement: numericAmount },
              usedAmount: { increment: numericAmount },
              isCompleted: false
            }
          })

          return { ...transaction, description: transaction.title, goalContribution: contribution, goal: updatedGoal }
        })

        return NextResponse.json(result)
      } else {
        // Goal deposit
        const finalTitle = titleValue || `Savings deposit: ${goal.name}`

        const result = await prisma.$transaction(async (tx) => {
          const transaction = await tx.transaction.create({
            data: {
              type: 'expense',
              amount: numericAmount,
              category: 'Goals',
              title: finalTitle,
              notes: goalReason || notes?.trim() || null,
              paymentMethod: paymentMethod || null,
              source: source || 'Goal Contribution',
              date: validDate,
              isOneTimeSubscription: false,
              userId: currentUserId
            }
          })

          const contribution = await tx.goalContribution.create({
            data: {
              goalId: goal.id,
              amount: numericAmount,
              type: 'deposit',
              reason: goalReason || notes?.trim() || null,
              transactionId: transaction.id,
              description: finalTitle,
              date: validDate
            }
          })

          const updatedGoal = await tx.savingsGoal.update({
            where: { id: goal.id },
            data: {
              currentAmount: { increment: numericAmount },
              isCompleted: Number(goal.currentAmount) + numericAmount >= Number(goal.targetAmount)
            }
          })

          return { ...transaction, description: transaction.title, goalContribution: contribution, goal: updatedGoal }
        })

        return NextResponse.json(result)
      }
    }

    if (!titleValue) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // 3. SUBSCRIPTION FLOW (Recurring vs One-Time)
    const isOneTime = Boolean(
      isOneTimeSubscription ||
      subscriptionKind === 'one-time' ||
      (category === 'Subscriptions' && subscriptionKind === 'one-time')
    )

    let linkedRecurringId = recurringTransactionId || null

    if (category === 'Subscriptions' && recurringSchedule && !isOneTime) {
      const nextDue = recurringSchedule.nextDue ? new Date(recurringSchedule.nextDue) : new Date(validDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      const recurring = await prisma.recurringTransaction.create({
        data: {
          type,
          amount: numericAmount,
          category: 'Subscriptions',
          description: titleValue,
          frequency: recurringSchedule.frequency || 'monthly',
          startDate: validDate,
          nextDue,
          paymentMethod: paymentMethod || null,
          source: source || null,
          splitType: 'personal',
          userId: currentUserId
        }
      })
      linkedRecurringId = recurring.id
    }

    // Standard transaction creation
    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount: numericAmount,
        category,
        title: titleValue,
        notes: notes ? String(notes).trim() : null,
        paymentMethod: paymentMethod || null,
        source: source || null,
        date: validDate,
        isOneTimeSubscription: isOneTime,
        recurringTransactionId: linkedRecurringId,
        userId: currentUserId
      }
    })

    return NextResponse.json({
      ...transaction,
      description: transaction.title
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const idsParam = searchParams.get('ids')

    // 1. Batch Deletion Support
    if (idsParam) {
      const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean)
      if (ids.length === 0) {
        return NextResponse.json({ error: 'No transaction IDs provided' }, { status: 400 })
      }

      await prisma.$transaction(async (tx) => {
        // Soft-delete linked travel entries
        await tx.travelEntry.updateMany({
          where: { transactionId: { in: ids }, userId: currentUserId, deletedAt: null },
          data: { deletedAt: new Date() }
        })

        // Reverse and soft-delete linked goal contributions
        const linkedContributions = await tx.goalContribution.findMany({
          where: { transactionId: { in: ids }, deletedAt: null },
          include: { goal: true }
        })
        for (const contrib of linkedContributions) {
          if (contrib.type === 'withdrawal') {
            await tx.savingsGoal.update({
              where: { id: contrib.goalId },
              data: {
                currentAmount: { increment: Number(contrib.amount) },
                usedAmount: { decrement: Number(contrib.amount) }
              }
            })
          } else {
            await tx.savingsGoal.update({
              where: { id: contrib.goalId },
              data: {
                currentAmount: { decrement: Number(contrib.amount) }
              }
            })
          }
        }
        if (linkedContributions.length > 0) {
          await tx.goalContribution.updateMany({
            where: { id: { in: linkedContributions.map(c => c.id) } },
            data: { deletedAt: new Date() }
          })
        }

        // Soft-delete transactions
        await tx.transaction.updateMany({
          where: { id: { in: ids }, userId: currentUserId, deletedAt: null },
          data: { deletedAt: new Date() }
        })
      })

      return NextResponse.json({
        success: true,
        deletedCount: ids.length,
        message: `Deleted ${ids.length} transactions and linked entries successfully`
      })
    }

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }

    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId: currentUserId }
    })

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found or access denied' }, { status: 404 })
    }

    const deletedTransaction = await prisma.$transaction(async (tx) => {
      // 1. Soft-delete linked travel entry if exists
      await tx.travelEntry.updateMany({
        where: { transactionId: id, userId: currentUserId, deletedAt: null },
        data: { deletedAt: new Date() }
      })

      // 2. Soft-delete linked goal contribution and reverse goal balance
      const goalContrib = await tx.goalContribution.findFirst({
        where: { transactionId: id, deletedAt: null },
        include: { goal: true }
      })
      if (goalContrib) {
        if (goalContrib.type === 'withdrawal') {
          await tx.savingsGoal.update({
            where: { id: goalContrib.goalId },
            data: {
              currentAmount: { increment: Number(goalContrib.amount) },
              usedAmount: { decrement: Number(goalContrib.amount) }
            }
          })
        } else {
          await tx.savingsGoal.update({
            where: { id: goalContrib.goalId },
            data: {
              currentAmount: { decrement: Number(goalContrib.amount) }
            }
          })
        }
        await tx.goalContribution.update({
          where: { id: goalContrib.id },
          data: { deletedAt: new Date() }
        })
      }

      // 3. Soft-delete transaction
      return await tx.transaction.update({
        where: { id },
        data: { deletedAt: new Date() }
      })
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Transaction and linked entries deleted successfully',
      transaction: deletedTransaction 
    })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ids, id, type, amount, category, title, description, notes, paymentMethod, source, date, isOneTimeSubscription } = body

    // 1. Batch Category Update Support
    if (ids && Array.isArray(ids) && ids.length > 0 && category) {
      await prisma.transaction.updateMany({
        where: {
          id: { in: ids },
          userId: currentUserId,
          deletedAt: null
        },
        data: { category }
      })
      return NextResponse.json({ success: true, updatedCount: ids.length, message: `Updated ${ids.length} transactions to ${category}` })
    }

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }

    if (!amount || !category) {
      return NextResponse.json({ error: 'Amount and category are required' }, { status: 400 })
    }

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a valid number greater than zero' }, { status: 400 })
    }

    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId: currentUserId }
    })

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found or access denied' }, { status: 404 })
    }

    // 2. Adjust linked Goal Contribution if exists
    const goalContribution = await prisma.goalContribution.findFirst({
      where: { transactionId: id }
    })

    if (goalContribution && existingTransaction.amount.toNumber() !== numericAmount) {
      const difference = numericAmount - existingTransaction.amount.toNumber()
      
      await prisma.goalContribution.update({
        where: { id: goalContribution.id },
        data: { amount: numericAmount }
      })

      if (goalContribution.type === 'withdrawal') {
        await prisma.savingsGoal.update({
          where: { id: goalContribution.goalId },
          data: {
            currentAmount: { decrement: difference },
            usedAmount: { increment: difference }
          }
        })
      } else {
        await prisma.savingsGoal.update({
          where: { id: goalContribution.goalId },
          data: { currentAmount: { increment: difference } }
        })
      }
    }

    // 3. Adjust linked Travel Entry if exists
    const travelEntry = await prisma.travelEntry.findFirst({
      where: { transactionId: id }
    })
    if (travelEntry) {
      const updatedTravelData: any = { amount: numericAmount }
      if (date) updatedTravelData.endDate = new Date(date)
      if (body.startKm !== undefined) updatedTravelData.startKm = parseFloat(body.startKm)
      if (body.endKm !== undefined) updatedTravelData.endKm = parseFloat(body.endKm)
      if (body.liters !== undefined) updatedTravelData.liters = parseFloat(body.liters)
      await prisma.travelEntry.update({
        where: { id: travelEntry.id },
        data: updatedTravelData
      })
    }

    const rawTitle = title !== undefined ? title : description
    if (rawTitle !== undefined && (!rawTitle || !rawTitle.trim())) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        type: type || existingTransaction.type,
        amount: numericAmount,
        category,
        title: rawTitle !== undefined ? rawTitle.trim() : existingTransaction.title,
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : existingTransaction.notes,
        paymentMethod: paymentMethod !== undefined ? (paymentMethod || null) : existingTransaction.paymentMethod,
        source: source !== undefined ? (source || null) : existingTransaction.source,
        date: date ? new Date(date) : existingTransaction.date,
        isOneTimeSubscription: isOneTimeSubscription !== undefined ? Boolean(isOneTimeSubscription) : existingTransaction.isOneTimeSubscription,
      }
    })

    return NextResponse.json({
      ...updatedTransaction,
      description: updatedTransaction.title
    })
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}
