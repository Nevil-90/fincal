// CRUD endpoints for user-specific static data: expense/income categories,
// payment methods, income sources, expense purposes, and budget amounts.
// On first fetch, default categories are auto-seeded for new users.
// Responses include a private Cache-Control header (5 min, stale-while-revalidate 10 min).

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
  createdAt: string
  updatedAt: string
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
        ...['Food & Dining', 'Groceries', 'Transportation', 'Petrol/Fuel', 'Auto Rickshaw/Taxi',
        'Public Transport', 'Shopping', 'Clothing', 'Entertainment', 'Movies/OTT',
        'Bills & Utilities', 'Electricity', 'Mobile Recharge', 'Internet', 'LPG/Gas',
        'Water Bill', 'Healthcare', 'Medicine', 'Doctor Consultation', 'Education',
        'Books/Courses', 'School/College Fees', 'Travel', 'Train/Flight', 'Hotel/Accommodation',
        'Rent', 'House Maintenance', 'Domestic Help', 'Religious/Charity', 'Temple/Gurudwara',
        'Donations', 'Investment', 'SIP/Mutual Fund', 'Fixed Deposit', 'Other'].map(name => ({ type: 'expense_categories', name, userId: currentUserId, isActive: true })),
        ...['Salary', 'Freelance', 'Business Income', 'Investment Returns', 'Rental Income',
        'Interest', 'Dividends', 'Capital Gains', 'Bonus', 'Commission', 'Gifts', 'Other'].map(name => ({ type: 'income_categories', name, userId: currentUserId, isActive: true })),
        ...['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Net Banking', 'Other'].map(name => ({ type: 'payment_methods', name, userId: currentUserId, isActive: true })),
        ...['Primary Job', 'Secondary Job', 'Freelance Work', 'Business', 'Investments',
        'Rental Property', 'Side Hustle', 'Consulting', 'Other'].map(name => ({ type: 'income_sources', name, userId: currentUserId, isActive: true })),
        ...['Personal', 'Business', 'Family', 'Medical', 'Emergency', 'Investment',
        'Education', 'Travel', 'Entertainment', 'Gift', 'Charity', 'Other'].map(name => ({ type: 'expense_purposes', name, userId: currentUserId, isActive: true }))
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

    const groupedData = categories.reduce((acc: Record<string, StaticDataItem[]>, category) => {
      if (!acc[category.type]) {
        acc[category.type] = []
      }
      acc[category.type].push({
        id: category.id,
        name: category.name,
        isActive: category.isActive,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString()
      })
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
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
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

      const existing = await prisma.budgetAmount.findFirst({
        where: { id, userId: currentUserId }
      })
      if (!existing) {
        return NextResponse.json({ error: 'Budget amount not found or access denied' }, { status: 404 })
      }

      updatedItem = await prisma.budgetAmount.update({
        where: { id },
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
      const existing = await prisma.staticDataCategory.findFirst({
        where: { id, userId: currentUserId }
      })
      if (!existing) {
        return NextResponse.json({ error: 'Static data category not found or access denied' }, { status: 404 })
      }
      
      updatedItem = await prisma.staticDataCategory.update({
        where: { id },
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

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and type are required' }, { status: 400 })
    }

    if (!VALID_TYPES.includes(type as ValidStaticDataType)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
    }

    if (type === 'budgetAmounts') {
      const existing = await prisma.budgetAmount.findFirst({
        where: { id, userId: currentUserId }
      })
      if (!existing) {
        return NextResponse.json({ error: 'Budget amount not found or access denied' }, { status: 404 })
      }

      await prisma.budgetAmount.delete({
        where: { id }
      })
    } else {
      const existing = await prisma.staticDataCategory.findFirst({
        where: { id, userId: currentUserId }
      })
      if (!existing) {
        return NextResponse.json({ error: 'Category not found or access denied' }, { status: 404 })
      }

      await prisma.staticDataCategory.delete({
        where: { id }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting static data:', error)
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete static data' }, { status: 500 })
  }
}
