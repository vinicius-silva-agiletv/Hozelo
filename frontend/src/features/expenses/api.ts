import { api } from '@/lib/api'
import type {
  ExpenseStatus,
  RequestAmortizeExpense,
  RequestRegisterExpense,
  RequestUpdateExpense,
  ResponseExpense,
  ResponseExpenses,
  ResponseMonthlyInstallments,
} from '@/types/api'

const query = (params: Record<string, string | number | null | undefined>) => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export const expensesApi = {
  /** month: "yyyy-MM" */
  monthly: (month: string, categoryId: number | null) => {
    const [year, m] = month.split('-').map(Number)
    return api.get<ResponseMonthlyInstallments>(`/installments${query({ year, month: m, categoryId })}`)
  },
  list: (categoryId: number | null, status: ExpenseStatus | null) =>
    api.get<ResponseExpenses>(`/expenses${query({ categoryId, status })}`),
  get: (id: number) => api.get<ResponseExpense>(`/expenses/${id}`),
  create: (request: RequestRegisterExpense) => api.post<ResponseExpense>('/expenses', request),
  update: (id: number, request: RequestUpdateExpense) => api.put<ResponseExpense>(`/expenses/${id}`, request),
  remove: (id: number) => api.delete(`/expenses/${id}`),
  pay: (id: number, number: number, paidOn?: string) =>
    api.post<ResponseExpense>(`/expenses/${id}/installments/${number}/payment`, paidOn ? { paidOn } : {}),
  undoPayment: (id: number, number: number) =>
    api.delete<ResponseExpense>(`/expenses/${id}/installments/${number}/payment`),
  amortize: (id: number, request: RequestAmortizeExpense) =>
    api.post<ResponseExpense>(`/expenses/${id}/amortizations`, request),
}
