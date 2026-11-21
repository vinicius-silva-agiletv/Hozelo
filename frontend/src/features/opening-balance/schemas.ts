import { z } from 'zod'

import { currentMonth } from '@/lib/month'
import type { RequestOpeningBalance, ResponseOpeningBalance } from '@/types/api'

/** data-model.md OpeningBalanceForm: valor sempre positivo no campo; o sinal vem de "Saldo negativo". */
export const openingBalanceSchema = z.object({
  amount: z.number().min(0),
  negative: z.boolean(),
  referenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de referência.'),
})

export type OpeningBalanceForm = z.infer<typeof openingBalanceSchema>

/** Dia 1º do mês atual (clarify Q2). */
export const firstDayOfCurrentMonth = (today: Date = new Date()) => `${currentMonth(today)}-01`

/** Valores iniciais: os do saldo atual ao alterar; zero e dia 1º do mês na primeira vez. */
export function toForm(current: ResponseOpeningBalance | null, today: Date = new Date()): OpeningBalanceForm {
  if (!current) return { amount: 0, negative: false, referenceDate: firstDayOfCurrentMonth(today) }
  return { amount: Math.abs(current.amount), negative: current.amount < 0, referenceDate: current.referenceDate }
}

export const toRequest = (form: OpeningBalanceForm): RequestOpeningBalance => ({
  amount: form.negative && form.amount !== 0 ? -form.amount : form.amount,
  referenceDate: form.referenceDate,
})
