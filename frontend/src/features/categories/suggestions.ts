import type { CategoryType } from '@/types/api'

/** Categorias comuns oferecidas em "Usar sugestões" (clarify Q1, data-model.md SuggestionsForm). */
export const categorySuggestions: Record<CategoryType, string[]> = {
  Expense: ['Mercado', 'Moradia', 'Água', 'Luz', 'Internet', 'Transporte', 'Cartão de crédito', 'Saúde', 'Lazer'],
  Income: ['Salário', '13º salário', 'Vendas', 'Outros'],
}

/** Compara nomes como a API: sem diferenciar maiúsculas e ignorando espaços nas pontas. */
export const sameName = (a: string, b: string) =>
  a.trim().localeCompare(b.trim(), 'pt-BR', { sensitivity: 'accent' }) === 0
