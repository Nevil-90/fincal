'use client'

export function memberName(member: any): string {
  if (!member) return '?'
  return member.isOwner ? 'You' : (member.nickname ?? member.participant?.name ?? '?')
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function getSimplifiedDebts(members: any[], expenses: any[], settlements: any[]) {
  const balances: Record<string, number> = {}
  members.forEach((member) => {
    balances[member.id] = 0
  })

  expenses.forEach((expense) => {
    if (expense.deletedAt || expense.isSettlement) return
    const paidById = expense.paidByMemberId
    ;(expense.splits ?? []).forEach((split: any) => {
      if (balances[paidById] !== undefined) balances[paidById] += Number(split.amount)
      if (balances[split.memberId] !== undefined) balances[split.memberId] -= Number(split.amount)
    })
  })

  settlements.forEach((settlement) => {
    if (settlement.deletedAt) return
    if (balances[settlement.fromMemberId] !== undefined) {
      balances[settlement.fromMemberId] += Number(settlement.amount)
    }
    if (balances[settlement.toMemberId] !== undefined) {
      balances[settlement.toMemberId] -= Number(settlement.amount)
    }
  })

  const debtors: { member: any; amount: number }[] = []
  const creditors: { member: any; amount: number }[] = []

  Object.entries(balances).forEach(([id, value]) => {
    const member = members.find((item) => item.id === id)
    const balance = Math.round(value * 100) / 100
    if (!member) return
    if (balance < -0.01) debtors.push({ member, amount: Math.abs(balance) })
    if (balance > 0.01) creditors.push({ member, amount: balance })
  })

  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)

  const transactions: { from: any; to: any; amount: number }[] = []
  let debtorIndex = 0
  let creditorIndex = 0

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex]
    const creditor = creditors[creditorIndex]
    const amount = Math.min(debtor.amount, creditor.amount)

    transactions.push({
      from: debtor.member,
      to: creditor.member,
      amount: Math.round(amount * 100) / 100,
    })

    debtor.amount -= amount
    creditor.amount -= amount
    if (debtor.amount < 0.01) debtorIndex += 1
    if (creditor.amount < 0.01) creditorIndex += 1
  }

  return transactions
}
