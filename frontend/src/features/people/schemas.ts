import { z } from 'zod'

import { isAfterToday, isValidIsoDate } from '@/lib/date'
import type { RequestPersonCharge, RequestPersonPayment } from '@/types/api'

/** data-model.md PersonForm (mesmas regras da API, feature 004). */
export const personSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(100, 'O nome deve ter no máximo 100 caracteres.'),
})
export type PersonForm = z.infer<typeof personSchema>

/** data-model.md PaymentForm. */
export const paymentSchema = z
  .object({
    amount: z.number(),
    paidOn: z.string(),
    notes: z.string().max(500, 'A observação deve ter no máximo 500 caracteres.'),
    chargeKeys: z.array(z.string()),
  })
  .superRefine((form, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message })
    if (!(form.amount > 0)) issue('amount', 'Informe um valor maior que zero.')
    if (!isValidIsoDate(form.paidOn)) issue('paidOn', 'Informe a data do pagamento.')
    else if (isAfterToday(form.paidOn)) issue('paidOn', 'A data não pode ser futura.')
  })
export type PaymentForm = z.infer<typeof paymentSchema>

export const paymentToRequest = (form: PaymentForm): RequestPersonPayment => ({
  amount: form.amount,
  paidOn: form.paidOn,
  notes: form.notes.trim() ? form.notes.trim() : null,
  ...(form.chargeKeys.length > 0 ? { chargeKeys: form.chargeKeys } : {}),
})

/** data-model.md ChargeForm (sem observação: research.md §6). */
export const chargeSchema = z
  .object({
    description: z.string().trim().min(1, 'Informe a descrição.').max(100, 'A descrição deve ter no máximo 100 caracteres.'),
    amount: z.number(),
    chargeDate: z.string(),
  })
  .superRefine((form, ctx) => {
    if (!(form.amount > 0)) ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Informe um valor maior que zero.' })
    if (!isValidIsoDate(form.chargeDate)) ctx.addIssue({ code: 'custom', path: ['chargeDate'], message: 'Informe a data.' })
  })
export type ChargeForm = z.infer<typeof chargeSchema>

export const chargeToRequest = (form: ChargeForm): RequestPersonCharge => ({
  description: form.description.trim(),
  amount: form.amount,
  chargeDate: form.chargeDate,
  notes: null,
})
