import { api } from '@/lib/api'
import type {
  RequestPerson,
  RequestPersonCharge,
  RequestPersonPayment,
  ResponsePeople,
  ResponsePerson,
  ResponsePersonCharge,
  ResponsePersonOverview,
  ResponsePersonPayment,
  ResponsePersonStatement,
} from '@/types/api'

export const peopleApi = {
  list: () => api.get<ResponsePeople>('/people'),
  create: (request: RequestPerson) => api.post<ResponsePerson>('/people', request),
  rename: (id: number, request: RequestPerson) => api.put<void>(`/people/${id}`, request),
  remove: (id: number) => api.delete(`/people/${id}`),
  /** month: "yyyy-MM" */
  statement: (id: number, month: string) => {
    const [year, m] = month.split('-').map(Number)
    return api.get<ResponsePersonStatement>(`/people/${id}/statement?year=${year}&month=${m}`)
  },
  summary: (id: number) => api.get<ResponsePersonOverview>(`/people/${id}/summary`),
  createCharge: (id: number, request: RequestPersonCharge) => api.post<ResponsePersonCharge>(`/people/${id}/charges`, request),
  updateCharge: (id: number, chargeId: number, request: RequestPersonCharge) =>
    api.put<ResponsePersonCharge>(`/people/${id}/charges/${chargeId}`, request),
  removeCharge: (id: number, chargeId: number) => api.delete(`/people/${id}/charges/${chargeId}`),
  createPayment: (id: number, request: RequestPersonPayment) => api.post<ResponsePersonPayment>(`/people/${id}/payments`, request),
  updatePayment: (id: number, paymentId: number, request: RequestPersonPayment) =>
    api.put<ResponsePersonPayment>(`/people/${id}/payments/${paymentId}`, request),
  removePayment: (id: number, paymentId: number) => api.delete(`/people/${id}/payments/${paymentId}`),
}
