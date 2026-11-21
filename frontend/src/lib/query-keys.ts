import type { CategoryType } from '@/types/api'

/** Chaves de cache do TanStack Query compartilhadas entre features (research.md §2). */
export const queryKeys = {
  profile: ['profile'] as const,
  categories: ['categories'] as const,
  categoriesByType: (type: CategoryType) => ['categories', type] as const,
  openingBalance: ['opening-balance'] as const,
}
