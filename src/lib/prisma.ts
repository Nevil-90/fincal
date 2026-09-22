// Prisma client singleton with two extensions:
//   1. Decimal → number coercion: overrides toJSON so API routes return plain numbers
//      instead of Prisma's stringified Decimal objects.
//   2. Soft-delete filter: automatically excludes records where deletedAt is set
//      for all supported models on read operations.

import { PrismaClient, Prisma } from '@/generated/prisma'

// Prevent Prisma Decimal values from serialising as strings in JSON responses,
// which would break arithmetic in React components.
if (Prisma && Prisma.Decimal) {
  (Prisma.Decimal.prototype as any).toJSON = function () {
    return Number(this.toString())
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Reuse a single connection across hot-reloads in development and across
// requests within a container in production, invalidating if schema changes.
const SCHEMA_VERSION = '2026-09-22-title-notes'
const staleInstance = globalForPrisma.prisma as any
const isStale = !staleInstance || staleInstance._schemaVersion !== SCHEMA_VERSION || !('userSetting' in staleInstance)

if (isStale) {
  if (staleInstance && typeof staleInstance.$disconnect === 'function') {
    try { staleInstance.$disconnect() } catch {}
  }
  const newClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : [],
  })
  ;(newClient as any)._schemaVersion = SCHEMA_VERSION
  globalForPrisma.prisma = newClient
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
            // findUnique doesn't support adding non-unique fields to where, so we
            // run the query normally and return null if the result is soft-deleted.
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
