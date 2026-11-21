import { api, ApiError } from '@/lib/api'
import type { RequestOpeningBalance, ResponseOpeningBalance } from '@/types/api'

export const openingBalanceApi = {
  /** 404 = ainda não informado (research.md §3): devolve `null` em vez de erro. */
  get: async (): Promise<ResponseOpeningBalance | null> => {
    try {
      return await api.get<ResponseOpeningBalance>('/opening-balance')
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null
      throw error
    }
  },
  save: (request: RequestOpeningBalance) => api.put<ResponseOpeningBalance>('/opening-balance', request),
}
