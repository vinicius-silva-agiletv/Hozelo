import { api } from '@/lib/api'
import type { ResponsePeople } from '@/types/api'

export const peopleApi = {
  list: () => api.get<ResponsePeople>('/people'),
}
