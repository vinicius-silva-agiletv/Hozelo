import { z } from 'zod'

import { checkPersonSplit, emptyPersonSplit, personSplitFromApi, personSplitToRequest } from '@/lib/person-split'
import type { EntryKind, RequestRecurrence, RequestUpdateRecurrence, ResponseRecurrence } from '@/types/api'

/** data-model.md RecurrenceForm (mesmas regras da API, feature 003; pessoa só em despesas, 004). */
export const recurrenceSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome.').max(100, 'O nome deve ter no máximo 100 caracteres.'),
    categoryId: z.number().nullable(),
    amount: z.number(),
    dayOfMonth: z.number().or(z.nan()),
    startMonth: z.string(),
    hasEnd: z.boolean(),
    endMonth: z.string(),
    notes: z.string().max(500, 'A observação deve ter no máximo 500 caracteres.'),
    splitWithPerson: z.boolean(),
    personId: z.number().nullable(),
    shareMode: z.enum(['full', 'percent']),
    personPercent: z.number().or(z.nan()).nullable(),
    /** Só no cadastro valor, início e fim são enviados (na edição a API não os aceita). */
    editing: z.boolean(),
  })
  .superRefine((form, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message })
    if (form.categoryId === null) issue('categoryId', 'Escolha a categoria.')
    if (!(Number.isInteger(form.dayOfMonth) && form.dayOfMonth >= 1 && form.dayOfMonth <= 31)) {
      issue('dayOfMonth', 'Informe um dia de 1 a 31.')
    }
    if (!form.editing) {
      if (!(form.amount > 0)) issue('amount', 'Informe um valor maior que zero.')
      if (form.hasEnd && form.endMonth < form.startMonth) issue('endMonth', 'O fim não pode ser antes do início.')
    }
    checkPersonSplit(form, issue)
  })

export type RecurrenceForm = z.infer<typeof recurrenceSchema>

export function emptyRecurrenceForm(startMonth: string, dayOfMonth: number): RecurrenceForm {
  return {
    name: '',
    categoryId: null,
    amount: 0,
    dayOfMonth,
    startMonth,
    hasEnd: false,
    endMonth: startMonth,
    notes: '',
    ...emptyPersonSplit,
    editing: false,
  }
}

export function recurrenceToForm(recurrence: ResponseRecurrence): RecurrenceForm {
  return {
    name: recurrence.name,
    categoryId: recurrence.category.id,
    amount: recurrence.currentAmount,
    dayOfMonth: recurrence.dayOfMonth,
    startMonth: recurrence.startMonth,
    hasEnd: recurrence.endMonth !== null,
    endMonth: recurrence.endMonth ?? recurrence.startMonth,
    notes: recurrence.notes ?? '',
    ...personSplitFromApi(recurrence.person, recurrence.personPercent),
    editing: true,
  }
}

export function formToUpdateRequest(form: RecurrenceForm, kind: EntryKind): RequestUpdateRecurrence {
  const person = kind === 'Expense' ? personSplitToRequest(form) : { personId: null, personPercent: null }
  return {
    name: form.name.trim(),
    categoryId: form.categoryId!,
    dayOfMonth: form.dayOfMonth,
    notes: form.notes.trim() ? form.notes.trim() : null,
    ...person,
  }
}

export function formToCreateRequest(form: RecurrenceForm, kind: EntryKind): RequestRecurrence {
  return {
    ...formToUpdateRequest(form, kind),
    kind,
    amount: form.amount,
    startMonth: form.startMonth,
    endMonth: form.hasEnd ? form.endMonth : null,
  }
}
