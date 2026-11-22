/** Derivações de exibição do resumo (data-model.md); tudo a partir dos valores da API. */
import { formatCurrency } from '@/lib/format'
import { fromCents, toCents } from '@/lib/money'
import { addMonths, currentMonth } from '@/lib/month'
import type { ResponseLedgerItem, ResponseMonthlySummary } from '@/types/api'

/** Detalhe do item na tela dele (FR-008). */
export function ledgerLink(item: Pick<ResponseLedgerItem, 'source' | 'sourceId' | 'direction' | 'month'>) {
  switch (item.source) {
    case 'Installment':
      return `/despesas?despesa=${item.sourceId}`
    case 'Income':
      return `/receitas?receita=${item.sourceId}`
    case 'Recurrence':
      return item.direction === 'Income' ? `/receitas?recorrencia=${item.sourceId}` : `/contas-fixas?recorrencia=${item.sourceId}`
    case 'Reimbursement':
      return `/pessoas/${item.sourceId}?mes=${item.month}`
  }
}

export const ledgerLabel = (item: Pick<ResponseLedgerItem, 'name' | 'number' | 'installmentsCount'>) =>
  item.installmentsCount && item.installmentsCount > 1 && item.number ? `${item.name} · ${item.number}/${item.installmentsCount}` : item.name

/** Valor exibido: o pago quando quitado; parcial mostra também o total ("de R$ Y"). */
export function ledgerShownAmount(item: Pick<ResponseLedgerItem, 'amount' | 'isSettled' | 'settledAmount'>) {
  const partial = item.isSettled && item.settledAmount !== null && item.settledAmount < item.amount
  const value = item.isSettled && item.settledAmount !== null ? item.settledAmount : item.amount
  return { value: formatCurrency(value), of: partial ? `de ${formatCurrency(item.amount)}` : null }
}

export type HeroReason = 'missing' | 'filtered' | 'beforeStart'

export type Hero =
  | {
      kind: 'accumulated'
      value: number
      previous: number
      previousMonth: string
      monthBalance: number
      /** Pendências de meses anteriores (a receber − a pagar), que a API soma no acumulado do mês atual. */
      pendingNet: number | null
      projection: boolean
    }
  | { kind: 'forecast'; value: number; reason: HeroReason }

/** Destaque principal (clarify Q1, research.md §3). */
export function heroOf(
  summary: Pick<ResponseMonthlySummary, 'accumulated' | 'forecast' | 'openingBalanceMissing'> & Partial<Pick<ResponseMonthlySummary, 'pending'>>,
  month: string,
  categoryId: number | null,
  today: string = currentMonth(),
): Hero {
  if (summary.accumulated) {
    return {
      kind: 'accumulated',
      value: summary.accumulated.endBalance,
      previous: summary.accumulated.previousBalance,
      previousMonth: addMonths(month, -1),
      monthBalance: summary.forecast.balance,
      pendingNet: summary.pending ? fromCents(toCents(summary.pending.toReceive) - toCents(summary.pending.toPay)) : null,
      projection: month >= today,
    }
  }
  const reason: HeroReason = summary.openingBalanceMissing ? 'missing' : categoryId !== null ? 'filtered' : 'beforeStart'
  return { kind: 'forecast', value: summary.forecast.balance, reason }
}
