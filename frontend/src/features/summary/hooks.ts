import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'

import { summaryApi } from './api'

/** Resumo do mês da API (itens de entrada e saída com previsto e realizado). */
export function useMonthlySummary(month: string, categoryId: number | null = null) {
  return useQuery({
    queryKey: queryKeys.monthlySummary(month, categoryId),
    queryFn: () => summaryApi.monthly(month, categoryId),
  })
}
