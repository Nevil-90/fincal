import { PrismaClient, Prisma } from '@/generated/prisma'

// Override Prisma's Decimal serialization globally so API routes return
// raw numbers to the client instead of stringified decimals.
// This prevents massive string concatenation bugs in React components.
if (Prisma && Prisma.Decimal) {
  (Prisma.Decimal.prototype as any).toJSON = function () {
    return Number(this.toString())
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use globalThis singleton in both dev and production.
// In dev it prevents "too many connections" during hot-reload.
// In production it reuses the connection across requests within a container.
const staleInstance = globalForPrisma.prisma
const isStale = staleInstance && !('userSetting' in staleInstance)

if (!staleInstance || isStale) {
  globalForPrisma.prisma = new PrismaClient({
    // Disable query logging in production — reduces overhead per request
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : [],
  })
}
const activePrisma = globalForPrisma.prisma!

const softDeleteExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const softDeleteModels = [
          'Transaction',
          'SavingsGoal',
          'GoalContribution',
          'RecurringTransaction',
          'MonthlyBudget',
          'Participant',
          'SharedSubscription',
          'TravelEntry'
        ]

        if (
          softDeleteModels.includes(model) &&
          (operation === 'findUnique' || operation === 'findFirst' || operation === 'findMany' || operation === 'count' || operation === 'aggregate')
        ) {
          if (operation === 'findUnique') {
            // Prisma findUnique doesn't allow adding non-unique fields to where.
            // But we can check if it returns a soft-deleted record and return null.
            const result = await query(args)
            if (result && (result as any).deletedAt !== null) {
              return null
            }
            return result
          } else {
            const queryArgs = (args || {}) as any
            queryArgs.where = queryArgs.where || {}
            if (queryArgs.where.deletedAt === undefined) {
              queryArgs.where.deletedAt = null
            }
            return query(queryArgs)
          }
        }
        return query(args)
      },
    },
  },
})

export const prisma = activePrisma.$extends(softDeleteExtension) as unknown as typeof activePrisma

