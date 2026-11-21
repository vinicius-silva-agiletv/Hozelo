import { z } from 'zod'

import type { CategoryType } from '@/types/api'

/** data-model.md CategoryForm (mesmos limites da API: nome obrigatório, até 50 caracteres). */
export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome da categoria.')
    .max(50, 'O nome deve ter no máximo 50 caracteres.'),
  type: z.enum(['Expense', 'Income']),
})

export type CategoryForm = z.infer<typeof categorySchema>

export const categoryTypeLabels: Record<CategoryType, { plural: string; singular: string }> = {
  Expense: { plural: 'Despesas', singular: 'Despesa' },
  Income: { plural: 'Receitas', singular: 'Receita' },
}
