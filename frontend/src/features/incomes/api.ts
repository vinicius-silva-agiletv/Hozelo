import { api } from '@/lib/api'
import type { RequestIncome, RequestUpdateIncome, ResponseIncome } from '@/types/api'

export const incomesApi = {
  get: (id: number) => api.get<ResponseIncome>(`/incomes/${id}`),
  create: (request: RequestIncome) => api.post<ResponseIncome>('/incomes', request),
  update: (id: number, request: RequestUpdateIncome) => api.put<ResponseIncome>(`/incomes/${id}`, request),
  remove: (id: number) => api.delete(`/incomes/${id}`),
  receive: (id: number, receivedOn?: string) =>
    api.post<ResponseIncome>(`/incomes/${id}/receipt`, receivedOn ? { receivedOn } : {}),
  undoReceipt: (id: number) => api.delete<ResponseIncome>(`/incomes/${id}/receipt`),
}
