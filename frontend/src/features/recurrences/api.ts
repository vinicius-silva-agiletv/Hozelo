import { api } from '@/lib/api'
import type {
  EntryKind,
  RequestRecurrence,
  RequestUpdateRecurrence,
  ResponseRecurrence,
  ResponseRecurrences,
} from '@/types/api'

/** "yyyy-MM" → "/months/2026/11" */
const monthPath = (id: number, month: string) => {
  const [year, m] = month.split('-').map(Number)
  return `/recurrences/${id}/months/${year}/${m}`
}

export const recurrencesApi = {
  list: (kind: EntryKind) => api.get<ResponseRecurrences>(`/recurrences?kind=${kind}`),
  get: (id: number) => api.get<ResponseRecurrence>(`/recurrences/${id}`),
  create: (request: RequestRecurrence) => api.post<ResponseRecurrence>('/recurrences', request),
  update: (id: number, request: RequestUpdateRecurrence) => api.put<ResponseRecurrence>(`/recurrences/${id}`, request),
  remove: (id: number) => api.delete(`/recurrences/${id}`),
  changeAmount: (id: number, amount: number, fromMonth: string) =>
    api.put<ResponseRecurrence>(`/recurrences/${id}/amount`, { amount, fromMonth }),
  end: (id: number, endMonth: string) => api.put<ResponseRecurrence>(`/recurrences/${id}/end`, { endMonth }),
  reopen: (id: number) => api.delete<ResponseRecurrence>(`/recurrences/${id}/end`),
  adjustMonth: (id: number, month: string, change: { amount?: number; skipped: boolean }) =>
    api.put<ResponseRecurrence>(monthPath(id, month), change),
  undoAdjustment: (id: number, month: string) => api.delete<ResponseRecurrence>(monthPath(id, month)),
  settle: (id: number, month: string, settledOn?: string) =>
    api.post<ResponseRecurrence>(`${monthPath(id, month)}/settlement`, settledOn ? { settledOn } : {}),
  undoSettlement: (id: number, month: string) => api.delete<ResponseRecurrence>(`${monthPath(id, month)}/settlement`),
}
