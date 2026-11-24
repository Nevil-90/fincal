// Normalises every spelling of the "Cash" payment method ("CASH", "cash", " Cash ") to "Cash".
//
//   node scripts/normalize-cash.mjs             -> DRY RUN: only prints what would change
//   node scripts/normalize-cash.mjs --confirm   -> writes a rollback .sql file first, then applies
//
// What it changes (all users):
//   transactions.paymentMethod            'CASH' etc. -> 'Cash'   (updatedAt untouched)
//   recurring_transactions.paymentMethod  'CASH' etc. -> 'Cash'
//   static_data_categories (payment_methods): keeps ONE "Cash" row per user
//       - if the user already has "Cash": the other spellings are removed
//       - otherwise the first other spelling is renamed to "Cash"
//       - the kept row is made active if any removed spelling was active
// Amounts, dates, categories and everything else are never touched.

import { PrismaClient } from '../src/generated/prisma/index.js'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const CONFIRM = process.argv.includes('--confirm')
const CANON = 'Cash'

const sqlLit = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)
const idList = (ids) => ids.map(sqlLit).join(', ')

async function main() {
  console.log(`\n💵 Cash payment-method normaliser: ${CONFIRM ? '🔴 LIVE (--confirm)' : '🟡 DRY RUN'}\n`)

  const txRows = await prisma.$queryRaw`
    SELECT "id", "paymentMethod" FROM "transactions"
    WHERE lower(btrim("paymentMethod")) = 'cash' AND "paymentMethod" <> ${CANON}`
  const recRows = await prisma.$queryRaw`
    SELECT "id", "paymentMethod" FROM "recurring_transactions"
    WHERE lower(btrim("paymentMethod")) = 'cash' AND "paymentMethod" <> ${CANON}`
  const staticRows = await prisma.$queryRaw`
    SELECT * FROM "static_data_categories"
    WHERE "type" = 'payment_methods' AND lower(btrim("name")) = 'cash'
    ORDER BY "userId", "createdAt", "id"`

  // Plan the static-data changes per user
  const byUser = new Map()
  for (const r of staticRows) {
    if (!byUser.has(r.userId)) byUser.set(r.userId, [])
    byUser.get(r.userId).push(r)
  }
  const toDelete = []        // full rows (for rollback re-insert)
  const toRename = []        // { row }  -> name becomes 'Cash'
  const toActivate = []      // { row }  -> isActive becomes true
  for (const rows of byUser.values()) {
    if (rows.length === 1 && rows[0].name === CANON) continue
    const keep = rows.find(r => r.name === CANON) || rows[0]
    const others = rows.filter(r => r !== keep)
    if (keep.name !== CANON) toRename.push(keep)
    if (!keep.isActive && others.some(r => r.isActive)) toActivate.push(keep)
    toDelete.push(...others)
  }

  const spellings = {}
  for (const r of txRows) spellings[r.paymentMethod] = (spellings[r.paymentMethod] || 0) + 1
  console.log(`transactions to fix:            ${txRows.length}`, spellings)
  console.log(`recurring templates to fix:     ${recRows.length}`)
  console.log(`payment-method rows to remove:  ${toDelete.length}`, toDelete.map(r => `${r.name} (user …${r.userId.slice(-6)})`))
  console.log(`payment-method rows to rename:  ${toRename.length}`, toRename.map(r => `${r.name} -> Cash (user …${r.userId.slice(-6)})`))
  console.log(`payment-method rows to enable:  ${toActivate.length}`)

  if (txRows.length + recRows.length + toDelete.length + toRename.length + toActivate.length === 0) {
    console.log('\n✅ Nothing to do. Everything already uses "Cash".')
    return
  }
  if (!CONFIRM) {
    console.log('\nDry run only. Re-run with --confirm to apply (a rollback file is written first).')
    return
  }

  // ---- Rollback file (written BEFORE any change) ----
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = path.resolve('backups', 'normalize-cash')
  fs.mkdirSync(dir, { recursive: true })
  const rollbackPath = path.join(dir, `rollback_${stamp}.sql`)
  let rb = `-- Rollback for normalize-cash run at ${new Date().toISOString()}\nBEGIN;\n`
  const groupBySpelling = (rows) => rows.reduce((m, r) => ((m[r.paymentMethod] ||= []).push(r.id), m), {})
  for (const [spelling, ids] of Object.entries(groupBySpelling(txRows)))
    rb += `UPDATE "transactions" SET "paymentMethod" = ${sqlLit(spelling)} WHERE "id" IN (${idList(ids)});\n`
  for (const [spelling, ids] of Object.entries(groupBySpelling(recRows)))
    rb += `UPDATE "recurring_transactions" SET "paymentMethod" = ${sqlLit(spelling)} WHERE "id" IN (${idList(ids)});\n`
  for (const r of toRename) rb += `UPDATE "static_data_categories" SET "name" = ${sqlLit(r.name)} WHERE "id" = ${sqlLit(r.id)};\n`
  for (const r of toActivate) rb += `UPDATE "static_data_categories" SET "isActive" = false WHERE "id" = ${sqlLit(r.id)};\n`
  for (const r of toDelete) {
    rb += `INSERT INTO "static_data_categories" ("id","type","name","isActive","isSystem","createdAt","updatedAt","userId") VALUES (` +
      [r.id, r.type, r.name].map(sqlLit).join(', ') + `, ${r.isActive}, ${r.isSystem}, ` +
      `${sqlLit(new Date(r.createdAt).toISOString())}, ${sqlLit(new Date(r.updatedAt).toISOString())}, ${sqlLit(r.userId)});\n`
  }
  rb += 'COMMIT;\n'
  fs.writeFileSync(rollbackPath, rb)
  console.log(`\n📝 Rollback written: ${rollbackPath}`)

  // ---- Apply atomically ----
  const totalBefore = await prisma.transaction.count()
  await prisma.$transaction(async (tx) => {
    if (txRows.length) {
      const n = await tx.$executeRaw`
        UPDATE "transactions" SET "paymentMethod" = ${CANON}
        WHERE lower(btrim("paymentMethod")) = 'cash' AND "paymentMethod" <> ${CANON}`
      if (n !== txRows.length) throw new Error(`transactions: expected ${txRows.length} updates, got ${n}. Aborting (rolled back).`)
    }
    if (recRows.length) {
      const n = await tx.$executeRaw`
        UPDATE "recurring_transactions" SET "paymentMethod" = ${CANON}
        WHERE lower(btrim("paymentMethod")) = 'cash' AND "paymentMethod" <> ${CANON}`
      if (n !== recRows.length) throw new Error(`recurring: expected ${recRows.length} updates, got ${n}. Aborting (rolled back).`)
    }
    for (const r of toDelete) await tx.$executeRaw`DELETE FROM "static_data_categories" WHERE "id" = ${r.id}`
    for (const r of toRename) await tx.$executeRaw`UPDATE "static_data_categories" SET "name" = ${CANON} WHERE "id" = ${r.id}`
    for (const r of toActivate) await tx.$executeRaw`UPDATE "static_data_categories" SET "isActive" = true WHERE "id" = ${r.id}`
  }, { timeout: 60000 })

  // ---- Verify ----
  const [{ n: leftTx }] = await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM "transactions" WHERE lower(btrim("paymentMethod")) = 'cash' AND "paymentMethod" <> ${CANON}`
  const [{ n: leftRec }] = await prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM "recurring_transactions" WHERE lower(btrim("paymentMethod")) = 'cash' AND "paymentMethod" <> ${CANON}`
  const dupUsers = await prisma.$queryRaw`SELECT "userId", COUNT(*)::int AS n FROM "static_data_categories" WHERE "type"='payment_methods' AND lower(btrim("name"))='cash' GROUP BY "userId" HAVING COUNT(*) > 1`
  const totalAfter = await prisma.transaction.count()
  if (leftTx || leftRec || dupUsers.length || totalAfter !== totalBefore) {
    throw new Error(`Verification failed: leftTx=${leftTx} leftRec=${leftRec} dupUsers=${dupUsers.length} count ${totalBefore}->${totalAfter}`)
  }
  console.log(`\n✅ Done. ${txRows.length} transactions + ${recRows.length} recurring now use "Cash"; one "Cash" payment method per user; transaction count unchanged (${totalAfter}).`)
}

main()
  .catch((e) => { console.error('\n❌', e.message || e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
