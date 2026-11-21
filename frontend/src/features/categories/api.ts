import { api } from '@/lib/api'
import type { CategoryType, ResponseCategories, ResponseCategory } from '@/types/api'

export const categoriesApi = {
  list: (type: CategoryType) => api.get<ResponseCategories>(`/categories?type=${type}`),
  create: (request: { name: string; type: CategoryType }) => api.post<ResponseCategory>('/categories', request),
  rename: (id: number, name: string) => api.put<void>(`/categories/${id}`, { name }),
  remove: (id: number) => api.delete(`/categories/${id}`),
}
