// CRUD endpoints for user-specific static data: expense/income categories,
// payment methods, income sources, expense purposes, and budget amounts.
// On first fetch, default categories are auto-seeded for new users.
// Responses include no-store Cache-Control headers to ensure real-time consistency.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VALID_TYPES = [
  'expenseCategories',
  'incomeCategories', 
  'paymentMethods',
  'incomeSources',
  'expensePurposes',
  'budgetAmounts'
] as const

type ValidStaticDataType = typeof VALID_TYPES[number]

interface StaticDataItem {
  id: string
  name: string
  isActive: boolean
  isSystem?: boolean
  createdAt: string
  updatedAt: string
}

function normalizeStem(str: string): string {
  const clean = str.trim().toLowerCase()
  if (clean.length > 3 && clean.endsWith('s') && !clean.endsWith('ss')) {
    return clean.slice(0, -1)
  }
  return clean
}

export async function GET(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let categories = await prisma.staticDataCategory.findMany({
      where: { userId: currentUserId },
      orderBy: { name: 'asc' }
    })

    if (categories.length === 0) {
      const defaultData = [
        ...[
          'Food & Dining',
          'Groceries',
          'Transportation',
          'Shopping',
          'Bills & Utilities',
          'Entertainment',
          'Healthcare',
          'Other'
        ].map(name => ({ type: 'expense_categories', name, userId: currentUserId, isActive: true })),
        ...[
          'Salary',
          'Freelance',
          'Business Income',
          'Other'
        ].map(name => ({ type: 'income_categories', name, userId: currentUserId, isActive: true })),
        ...[
          'UPI',
          'Cash',
          'Credit Card',
          'Debit Card',
          'Net Banking'
        ].map(name => ({ type: 'payment_methods', name, userId: currentUserId, isActive: true })),
        ...[
          'Primary Job',
          'Freelance',
          'Business',
          'Other'
        ].map(name => ({ type: 'income_sources', name, userId: currentUserId, isActive: true })),
        ...[
          'Personal',
          'Family',
          'Business',
          'Other'
        ].map(name => ({ type: 'expense_purposes', name, userId: currentUserId, isActive: true }))
      ];

      await prisma.staticDataCategory.createMany({
        data: defaultData,
        skipDuplicates: true
      })

      categories = await prisma.staticDataCategory.findMany({
        where: { userId: currentUserId },
        orderBy: { name: 'asc' }
      })
    }

    const [budgetAmounts, settings] = await Promise.all([
      prisma.budgetAmount.findMany({
        where: { userId: currentUserId },
        orderBy: { name: 'asc' }
      }),
      prisma.userSetting.findMany({
        where: { userId: currentUserId }
      })
    ])

    const normalizeType = (t: string) => t.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')

    const groupedData = categories.reduce((acc: Record<string, StaticDataItem[]>, category) => {
      const typeKey = normalizeType(category.type)
      if (!acc[typeKey]) {
        acc[typeKey] = []
      }
      if (!acc[typeKey].some(item => item.name.toLowerCase() === category.name.toLowerCase())) {
        acc[typeKey].push({
          id: category.id,
          name: category.name,
          isActive: category.isActive,
          isSystem: Boolean(category.isSystem) || ['Fuel', 'Subscriptions', 'Goals'].includes(category.name),
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString()
        })
      }
      return acc
    }, {})
    
    const userSettings = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {} as Record<string, string>)

    const formattedBudgetAmounts = budgetAmounts.map(budget => ({
      id: budget.id,
      name: budget.name,
      amount: budget.amount,
      period: budget.period as 'monthly' | 'yearly',
      category: budget.category,
      isActive: budget.isActive,
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString()
    }))

    const staticData = {
      expenseCategories: groupedData.expense_categories || [],
      incomeCategories: groupedData.income_categories || [],
      paymentMethods: groupedData.payment_methods || [],
      incomeSources: groupedData.income_sources || [],
      expensePurposes: groupedData.expense_purposes || [],
      budgetAmounts: formattedBudgetAmounts,
      userSettings
    }

    return NextResponse.json(staticData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error fetching static data:', error)
    return NextResponse.json({ error: 'Failed to fetch static data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, name, amount, period, category } = body

    if (!type || !name) {
      return NextResponse.json({ error: 'Type and name are required' }, { status: 400 })
    }

    if (!VALID_TYPES.includes(type as ValidStaticDataType)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
    }

    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    }

    let createdItem
    
    if (type === 'budgetAmounts') {
      if (!amount || !period || !category) {
        return NextResponse.json({ error: 'Amount, period, and category are required for budget amounts' }, { status: 400 })
      }

      if (period !== 'monthly' && period !== 'yearly') {
        return NextResponse.json({ error: 'Period must be either "monthly" or "yearly"' }, { status: 400 })
      }

      const numericAmount = parseFloat(amount)
      if (isNaN(numericAmount) || numericAmount < 0) {
        return NextResponse.json({ error: 'Amount must be a non-negative number' }, { status: 400 })
      }
      
      createdItem = await prisma.budgetAmount.create({
        data: {
          name: name.trim(),
          amount: numericAmount,
          period,
          category: category.trim(),
          isActive: true,
          userId: currentUserId
        }
      })

      return NextResponse.json({
        id: createdItem.id,
        name: createdItem.name,
        amount: createdItem.amount,
        period: createdItem.period,
        category: createdItem.category,
        isActive: createdItem.isActive,
        createdAt: createdItem.createdAt.toISOString(),
        updatedAt: createdItem.updatedAt.toISOString()
      })
    } else {
      const dbType = type.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')

      // Dynamic normalized duplicate check against user's actual categories
      const cleanStem = normalizeStem(name)
      const existingCategories = await prisma.staticDataCategory.findMany({
        where: {
          userId: currentUserId,
          type: dbType
        },
        select: { id: true, name: true }
      })

      const duplicate = existingCategories.find(c =>
        c.name.trim().toLowerCase() === name.trim().toLowerCase() ||
        normalizeStem(c.name) === cleanStem
      )

      if (duplicate) {
        return NextResponse.json({ error: `Category "${duplicate.name}" is already added.` }, { status: 409 })
      }
      
      createdItem = await prisma.staticDataCategory.create({
        data: {
          type: dbType,
          name: name.trim(),
          isActive: true,
          userId: currentUserId
        }
      })

      return NextResponse.json({
        id: createdItem.id,
        name: createdItem.name,
        isActive: createdItem.isActive,
        createdAt: createdItem.createdAt.toISOString(),
        updatedAt: createdItem.updatedAt.toISOString()
      })
    }
  } catch (error) {
    console.error('Error creating static data:', error)
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Item already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create static data' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUserId = request.headers.get('x-user-id')
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, type, name, isActive, amount, period, category } = body

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and type are required' }, { status: 400 })
    }

    if (!VALID_TYPES.includes(type as ValidStaticDataType)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    }

    let updatedItem

    if (type === 'budgetAmounts') {
      if (period !== undefined && period !== 'monthly' && period !== 'yearly') {
        return NextResponse.json({ error: 'Period must be either "monthly" or "yearly"' }, { status: 400 })
      }

      if (amount !== undefined) {
        const numericAmount = parseFloat(amount)
        if (isNaN(numericAmount) || numericAmount < 0) {
          return NextResponse.json({ error: 'Amount must be a non-negative number' }, { status: 400 })
        }
      }

      // Try finding by id first, or by (name, category) if id was a client fallback
      let existing = await prisma.budgetAmount.findFirst({
        where: { id, userId: currentUserId }
      })
      if (!existing && name && category) {
        existing = await prisma.budgetAmount.findFirst({
          where: { name: name.trim(), category: category.trim(), userId: currentUserId }
        })
      }

      if (!existing) {
        // If not found, create new budget amount entry
        if (name && amount !== undefined && period && category) {
          const created = await prisma.budgetAmount.create({
            data: {
              name: name.trim(),
              amount: parseFloat(amount),
              period,
              category: category.trim(),
              isActive: isActive !== undefined ? isActive : true,
              userId: currentUserId
            }
          })
          return NextResponse.json({
            id: created.id,
            name: created.name,
            amount: created.amount,
            period: created.period,
            category: created.category,
            isActive: created.isActive,
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString()
          })
        }
        return NextResponse.json({ error: 'Budget amount not found or access denied' }, { status: 404 })
      }

      updatedItem = await prisma.budgetAmount.update({
        where: { id: existing.id },
        data: {
          ...(name && { name: name.trim() }),
          ...(amount !== undefined && { amount: parseFloat(amount) }),
          ...(period && { period }),
          ...(category && { category: category.trim() }),
          ...(isActive !== undefined && { isActive })
        }
      })

      return NextResponse.json({
        id: updatedItem.id,
        name: updatedItem.name,
        amount: updatedItem.amount,
        period: updatedItem.period,
        category: updatedItem.category,
        isActive: updatedItem.isActive,
        createdAt: updatedItem.createdAt.toISOString(),
        updatedAt: updatedItem.updatedAt.toISOString()
      })
    } else {
      const dbType = type.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')

      // 1. Try finding by ID first
      let existing = await prisma.staticDataCategory.findFirst({
        where: { id, userId: currentUserId }
      })

      // 2. If not found by ID (e.g. client fallback IDs like exp_1, inc_2), try matching by name & type
      if (!existing && name) {
        existing = await prisma.staticDataCategory.findFirst({
          where: { type: dbType, name: name.trim(), userId: currentUserId }
        })
      }

      // 3. If still not found and we have a name, upsert so the user action succeeds seamlessly
      if (!existing) {
        if (name && name.trim().length > 0) {
          const created = await prisma.staticDataCategory.upsert({
            where: {
              type_name_userId: {
                type: dbType,
                name: name.trim(),
                userId: currentUserId
              }
            },
            update: {
              ...(isActive !== undefined && { isActive })
            },
            create: {
              type: dbType,
              name: name.trim(),
              isActive: isActive !== undefined ? isActive : true,
              userId: currentUserId
            }
          })

          return NextResponse.json({
            id: created.id,
            name: created.name,
            isActive: created.isActive,
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString()
          })
        }

        return NextResponse.json({ error: 'Static data category not found or access denied' }, { status: 404 })
      }

      // 4. If name is being changed, check for duplicate item name and system category lock
      if (name && name.trim() !== existing.name) {
        if (existing.isSystem || ['Fuel', 'Subscriptions', 'Goals'].includes(existing.name)) {
          return NextResponse.json({ error: 'System categories cannot be renamed' }, { status: 400 })
        }
        const cleanStem = normalizeStem(name)
        const otherCategories = await prisma.staticDataCategory.findMany({
          where: {
            userId: currentUserId,
            type: dbType,
            id: { not: existing.id }
          },
          select: { id: true, name: true }
        })

        const duplicate = otherCategories.find(c =>
          c.name.trim().toLowerCase() === name.trim().toLowerCase() ||
          normalizeStem(c.name) === cleanStem
        )

        if (duplicate) {
          return NextResponse.json({ error: `Category "${duplicate.name}" is already added.` }, { status: 409 })
        }
      }
      
      updatedItem = await prisma.staticDataCategory.update({
        where: { id: existing.id },
        data: {
          ...(name && { name: name.trim() }),
          ...(isActive !== undefined && { isActive })
        }
      })

      return NextResponse.json({
        id: updatedItem.id,
        name: updatedItem.name,
        isActive: updatedItem.isActive,
        createdAt: updatedItem.createdAt.toISOString(),
        updatedAt: updatedItem.updatedAt.toISOString()
      })
    }
  } catch (error) {
    console.error('Error updating static data:', error)
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Item with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update static data' }, { status: 500 })
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
    const type = searchParams.get('type')
    const name = searchParams.get('name')

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and type are required' }, { status: 400 })
    }

    if (!VALID_TYPES.includes(type as ValidStaticDataType)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
    }

    if (type === 'budgetAmounts') {
      let existing = await prisma.budgetAmount.findFirst({
        where: { id, userId: currentUserId }
      })
      if (!existing && name) {
        existing = await prisma.budgetAmount.findFirst({
          where: { name: name.trim(), userId: currentUserId }
        })
      }

      if (existing) {
        await prisma.budgetAmount.delete({
          where: { id: existing.id }
        })
      }
    } else {
      const dbType = type.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
      let existing = await prisma.staticDataCategory.findFirst({
        where: { id, userId: currentUserId }
      })
      if (!existing && name) {
        existing = await prisma.staticDataCategory.findFirst({
          where: { type: dbType, name: name.trim(), userId: currentUserId }
        })
      }

      if (existing) {
        if (existing.isSystem || ['Fuel', 'Subscriptions', 'Goals'].includes(existing.name)) {
          return NextResponse.json({ error: 'System categories cannot be deleted' }, { status: 400 })
        }
        await prisma.staticDataCategory.delete({
          where: { id: existing.id }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting static data:', error)
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'Failed to delete static data' }, { status: 500 })
  }
}
