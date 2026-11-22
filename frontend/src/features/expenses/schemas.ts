import { z } from 'zod'

import { isValidIsoDate } from '@/lib/date'
import { checkPersonSplit, emptyPersonSplit, personSplitFromApi, personSplitToRequest } from '@/lib/person-split'
import type { AmountType, RequestRegisterExpense, ResponseExpense } from '@/types/api'

/** data-model.md ExpenseForm (mesmos limites da API: features 002 e 004). */
export const expenseSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome da despesa.').max(100, 'O nome deve ter no máximo 100 caracteres.'),
    categoryId: z.number().nullable(),
    amountType: z.enum(['Total', 'Installment']),
    amount: z.number(),
    isInstallment: z.boolean(),
    installmentsCount: z.number().or(z.nan()),
    firstDueDate: z.string(),
    alreadyPaidInstallments: z.number().or(z.nan()),
    notes: z.string().max(500, 'A observação deve ter no máximo 500 caracteres.'),
    splitWithPerson: z.boolean(),
    personId: z.number().nullable(),
    shareMode: z.enum(['full', 'percent']),
    personPercent: z.number().or(z.nan()).nullable(),
  })
  .superRefine((form, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message })
    const count = form.isInstallment ? form.installmentsCount : 1

    if (form.categoryId === null) issue('categoryId', 'Escolha a categoria.')
    if (!(form.amount > 0)) issue('amount', 'Informe um valor maior que zero.')
    if (form.isInstallment && !(Number.isInteger(count) && count >= 2 && count <= 480)) {
      issue('installmentsCount', 'Informe de 2 a 480 parcelas.')
    }
    if (!isValidIsoDate(form.firstDueDate)) issue('firstDueDate', 'Informe o primeiro vencimento.')
    const paid = form.alreadyPaidInstallments
    if (!(Number.isInteger(paid) && paid >= 0 && (!Number.isInteger(count) || paid <= count))) {
      issue('alreadyPaidInstallments', 'Informe de 0 até a quantidade de parcelas.')
    }
    checkPersonSplit(form, issue)
  })

export type ExpenseForm = z.infer<typeof expenseSchema>

export function emptyExpenseForm(firstDueDate: string): ExpenseForm {
  return {
    name: '',
    categoryId: null,
    amountType: 'Total',
    amount: 0,
    isInstallment: false,
    installmentsCount: 2,
    firstDueDate,
    alreadyPaidInstallments: 0,
    notes: '',
    ...emptyPersonSplit,
  }
}

/** Valores da edição: mesmo modo de valor do cadastro (FR-009). */
export function expenseToForm(expense: ResponseExpense): ExpenseForm {
  return {
    name: expense.name,
    categoryId: expense.category.id,
    amountType: expense.amountType,
    amount: expense.amountType === 'Total' ? expense.totalAmount : expense.installmentAmount,
    isInstallment: expense.isInstallment,
    installmentsCount: expense.isInstallment ? expense.installmentsCount : 2,
    firstDueDate: expense.firstDueDate,
    alreadyPaidInstallments: 0,
    notes: expense.notes ?? '',
    ...personSplitFromApi(expense.person, expense.personPercent),
  }
}

export function formToRequest(form: ExpenseForm): RequestRegisterExpense {
  return {
    name: form.name.trim(),
    categoryId: form.categoryId!,
    amountType: form.amountType as AmountType,
    amount: form.amount,
    isInstallment: form.isInstallment,
    installmentsCount: form.isInstallment ? form.installmentsCount : 1,
    firstDueDate: form.firstDueDate,
    alreadyPaidInstallments: form.alreadyPaidInstallments,
    notes: form.notes.trim() ? form.notes.trim() : null,
    ...personSplitToRequest(form),
  }
}
