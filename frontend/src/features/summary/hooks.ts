import { useQuery } from '@tanstack/react-query'

import { useCategories } from '@/features/categories/hooks'
import { queryKeys } from '@/lib/query-keys'

import { summaryApi } from './api'

/** Resumo do mês da API (itens de entrada e saída com previsto e realizado). */
export function useMonthlySummary(month: string, categoryId: number | null = null) {
  return useQuery({
    queryKey: queryKeys.monthlySummary(month, categoryId),
    queryFn: () => summaryApi.monthly(month, categoryId),
  })
}

/** Categoria do endereço só vale se existir entre as de despesa ou receita (Edge Cases). */
export function useKnownCategory(categoryId: number | null) {
  const expenses = useCategories('Expense')
  const incomes = useCategories('Income')
  if (categoryId === null || !expenses.data || !incomes.data) return categoryId
  return [...expenses.data, ...incomes.data].some((c) => c.id === categoryId) ? categoryId : null
}
