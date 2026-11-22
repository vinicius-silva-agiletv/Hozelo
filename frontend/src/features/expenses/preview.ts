/**
 * Prévias exibidas antes de salvar (research.md §5), em centavos e com as mesmas regras da API
 * (feature 002). Servem só para mostrar: depois de salvar, valem os valores devolvidos pela API.
 */
import { addMonthsToDate, lastDayOfMonth, parseIsoDate, toIsoDate } from '@/lib/date'
import type { AmountType } from '@/types/api'

/** Valor da parcela = total ÷ quantidade; a sobra de centavos vai para a última. */
export function splitInstallments(totalCents: number, count: number) {
  const installment = Math.floor(totalCents / count)
  return { installment, last: totalCents - installment * (count - 1) }
}

export const totalFromInstallment = (installmentCents: number, count: number) => installmentCents * count

/** Vencimento da parcela `number` (1 = primeira): mesmo dia do mês ou o último dia. */
export const installmentDueDate = (firstDueDate: string, number: number) => addMonthsToDate(firstDueDate, number - 1)

const monthIndex = (iso: string) => {
  const { year, month } = parseIsoDate(iso)
  return year * 12 + month
}

/** Parcelas com vencimento antes do mês atual (clarify Q3, FR-018). */
export function suggestedPaidCount(firstDueDate: string, count: number, today: string) {
  const elapsed = monthIndex(today) - monthIndex(firstDueDate)
  return Math.max(0, Math.min(count, elapsed))
}

/** Dia de hoje no mês aberto ("yyyy-MM"), limitado ao último dia do mês (clarify Q4). */
export function defaultFirstDueDate(viewMonth: string, today: string) {
  const [year, month] = viewMonth.split('-').map(Number)
  const { day } = parseIsoDate(today)
  return toIsoDate(year, month, Math.min(day, lastDayOfMonth(year, month)))
}

export function amortizationPreview(installmentCents: number[], paidCents: number) {
  const sum = installmentCents.reduce((total, cents) => total + cents, 0)
  return { sum, discount: Math.max(0, sum - paidCents) }
}

/** Parte da pessoa numa parcela, arredondada ao centavo. */
export const personShare = (installmentCents: number, percent: number) => Math.round((installmentCents * percent) / 100)

export interface ExpenseSummaryInput {
  amountType: AmountType
  amountCents: number
  count: number
  firstDueDate: string
  alreadyPaid: number
}

/** Resumo do formulário (FR-008). */
export function expenseSummary({ amountType, amountCents, count, firstDueDate, alreadyPaid }: ExpenseSummaryInput) {
  const split =
    amountType === 'Total' ? splitInstallments(amountCents, count) : { installment: amountCents, last: amountCents }
  const total = amountType === 'Total' ? amountCents : totalFromInstallment(amountCents, count)
  return {
    count,
    installment: split.installment,
    last: split.last,
    hasRemainder: split.last !== split.installment,
    total,
    lastDueDate: installmentDueDate(firstDueDate, count),
    paid: Math.min(alreadyPaid, count),
    remaining: Math.max(0, count - alreadyPaid),
  }
}
