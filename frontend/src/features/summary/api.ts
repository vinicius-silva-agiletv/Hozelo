import { api } from '@/lib/api'
import type { ResponseMonthlySummary } from '@/types/api'

export const summaryApi = {
  /** month: "yyyy-MM" */
  monthly: (month: string, categoryId: number | null) => {
    const [year, m] = month.split('-').map(Number)
    const category = categoryId === null ? '' : `&categoryId=${categoryId}`
    return api.get<ResponseMonthlySummary>(`/summaries?year=${year}&month=${m}${category}`)
  },
}
