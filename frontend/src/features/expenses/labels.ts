import type { ResponseMonthlyInstallment, ResponseShortExpense } from '@/types/api'

/** "Geladeira, parcela 3 de 10" (ou só o nome quando à vista). */
export const installmentLabel = (item: Pick<ResponseMonthlyInstallment, 'expenseName' | 'number' | 'installmentsCount'>) =>
  item.installmentsCount > 1 ? `${item.expenseName}, parcela ${item.number} de ${item.installmentsCount}` : item.expenseName

/** "Sogro · 50%" quando a despesa é dividida com uma pessoa. */
export const personText = (expense: Pick<ResponseShortExpense, 'person' | 'personPercent'>) =>
  expense.person ? `${expense.person.name} · ${expense.personPercent ?? 100}%` : null
