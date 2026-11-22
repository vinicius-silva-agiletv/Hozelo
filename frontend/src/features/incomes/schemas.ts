import { z } from 'zod'

import { isAfterToday, isValidIsoDate } from '@/lib/date'
import type { RequestIncome, ResponseIncome } from '@/types/api'

/** data-model.md IncomeForm (receita avulsa; mesmas regras da API, feature 003). */
export const incomeSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome da receita.').max(100, 'O nome deve ter no máximo 100 caracteres.'),
    categoryId: z.number().nullable(),
    amount: z.number(),
    expectedDate: z.string(),
    alreadyReceived: z.boolean(),
    receivedOn: z.string(),
    notes: z.string().max(500, 'A observação deve ter no máximo 500 caracteres.'),
  })
  .superRefine((form, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message })
    if (form.categoryId === null) issue('categoryId', 'Escolha a categoria.')
    if (!(form.amount > 0)) issue('amount', 'Informe um valor maior que zero.')
    if (!isValidIsoDate(form.expectedDate)) issue('expectedDate', 'Informe a data prevista.')
    if (form.alreadyReceived) {
      if (!isValidIsoDate(form.receivedOn)) issue('receivedOn', 'Informe a data do recebimento.')
      else if (isAfterToday(form.receivedOn)) issue('receivedOn', 'A data não pode ser futura.')
    }
  })

export type IncomeForm = z.infer<typeof incomeSchema>

export const emptyIncomeForm = (expectedDate: string, today: string): IncomeForm => ({
  name: '',
  categoryId: null,
  amount: 0,
  expectedDate,
  alreadyReceived: false,
  receivedOn: today,
  notes: '',
})

export const incomeToForm = (income: ResponseIncome, today: string): IncomeForm => ({
  name: income.name,
  categoryId: income.category.id,
  amount: income.amount,
  expectedDate: income.expectedDate,
  alreadyReceived: false,
  receivedOn: today,
  notes: income.notes ?? '',
})

export function incomeToRequest(form: IncomeForm): RequestIncome {
  return {
    name: form.name.trim(),
    categoryId: form.categoryId!,
    amount: form.amount,
    expectedDate: form.expectedDate,
    notes: form.notes.trim() ? form.notes.trim() : null,
    ...(form.alreadyReceived ? { receivedOn: form.receivedOn } : {}),
  }
}
