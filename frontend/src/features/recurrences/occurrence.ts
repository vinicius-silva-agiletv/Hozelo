/**
 * Leitura do estado de uma recorrência num mês (data-model.md "Derivações da tela"). Tudo vem dos
 * dados da API (histórico de valores, registros por mês e itens do resumo); nada é gravado daqui.
 */
import { fromCents, toCents } from '@/lib/money'
import type { ResponseLedgerItem, ResponseRecurrence, ResponseShortRecurrence } from '@/types/api'

export const isActiveIn = (recurrence: Pick<ResponseShortRecurrence, 'startMonth' | 'endMonth'>, month: string) =>
  recurrence.startMonth <= month && (recurrence.endMonth === null || month <= recurrence.endMonth)

/** Valor vigente no mês pelo histórico (último `fromMonth` ≤ mês). */
export function normalAmount(recurrence: Pick<ResponseRecurrence, 'amounts' | 'currentAmount'>, month: string) {
  const applicable = recurrence.amounts
    .filter((entry) => entry.fromMonth <= month)
    .sort((a, b) => a.fromMonth.localeCompare(b.fromMonth))
  return applicable.length > 0 ? applicable[applicable.length - 1].amount : recurrence.currentAmount
}

export const monthRecord = (recurrence: Pick<ResponseRecurrence, 'months'>, month: string) =>
  recurrence.months.find((record) => record.month === month) ?? null

export type OccurrenceStatus = 'open' | 'settled' | 'skipped'

export interface Occurrence {
  status: OccurrenceStatus
  /** Valor do mês (ajustado ou normal). */
  amount: number
  normal: number
  adjusted: boolean
  /** Valor efetivamente pago/recebido, quando quitada. */
  settledAmount: number | null
  settledOn: string | null
  date: string | null
}

/**
 * Estado da ocorrência: pulada pelo registro do mês (a API não manda puladas no resumo); quitada e
 * data pelo item do resumo; valor do item quando houver, senão o do registro ou o normal.
 */
export function occurrenceOf(recurrence: ResponseRecurrence | undefined, item: ResponseLedgerItem | undefined, month: string): Occurrence | null {
  if (!recurrence && !item) return null
  const record = recurrence ? monthRecord(recurrence, month) : null
  const normal = recurrence ? normalAmount(recurrence, month) : (item?.amount ?? 0)
  const amount = item?.amount ?? record?.amount ?? normal
  if (record?.skipped) {
    return { status: 'skipped', amount: normal, normal, adjusted: false, settledAmount: null, settledOn: null, date: null }
  }
  return {
    status: item?.isSettled ? 'settled' : 'open',
    amount,
    normal,
    adjusted: record?.amount !== null && record?.amount !== undefined && record.amount !== normal,
    settledAmount: item?.isSettled ? (item.settledAmount ?? item.amount) : null,
    settledOn: item?.settledOn ?? null,
    date: item?.date ?? null,
  }
}

const sum = (values: number[]) => fromCents(values.reduce((total, value) => total + toCents(value), 0))

/** Totais de contas fixas a partir das ocorrências (sem as puladas). */
export function fixedBillTotals(occurrences: Occurrence[]) {
  const counted = occurrences.filter((occurrence) => occurrence.status !== 'skipped')
  return {
    forecast: sum(counted.map((occurrence) => occurrence.amount)),
    paid: sum(counted.filter((o) => o.status === 'settled').map((o) => o.settledAmount ?? o.amount)),
    open: sum(counted.filter((o) => o.status === 'open').map((o) => o.amount)),
  }
}
