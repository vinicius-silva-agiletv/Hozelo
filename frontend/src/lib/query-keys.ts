import type { CategoryType, ExpenseStatus } from '@/types/api'

/** Chaves de cache do TanStack Query compartilhadas entre features (research.md §2/§3). */
export const queryKeys = {
  profile: ['profile'] as const,
  categories: ['categories'] as const,
  categoriesByType: (type: CategoryType) => ['categories', type] as const,
  openingBalance: ['opening-balance'] as const,
  installments: ['installments'] as const,
  monthlyInstallments: (month: string, categoryId: number | null) => ['installments', month, categoryId] as const,
  expenses: ['expenses'] as const,
  expenseList: (filters: { categoryId: number | null; status: ExpenseStatus | null }) => ['expenses', filters] as const,
  expense: (id: number) => ['expense', id] as const,
  people: ['people'] as const,
}
