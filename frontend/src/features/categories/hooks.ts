import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { errorMessages } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import type { CategoryType } from '@/types/api'

import { categoriesApi } from './api'

const byName = new Intl.Collator('pt-BR', { sensitivity: 'base' })

export function useCategories(type: CategoryType) {
  return useQuery({
    queryKey: queryKeys.categoriesByType(type),
    queryFn: () => categoriesApi.list(type),
    select: (data) => [...data.categories].sort((a, b) => byName.compare(a.name, b.name)),
  })
}

/** Invalida as listas dos dois tipos (contagens e nomes podem mudar). */
function useInvalidateCategories() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.categories })
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({ mutationFn: categoriesApi.create, onSuccess: invalidate })
}

export function useRenameCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => categoriesApi.rename(id, name),
    onSuccess: invalidate,
  })
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({ mutationFn: categoriesApi.remove, onSuccess: invalidate })
}

export interface SuggestionsResult {
  created: string[]
  failures: { name: string; messages: string[] }[]
}

/**
 * Cria as sugestões marcadas uma a uma (research.md §6): cada nome passa pela validação da API, e as
 * recusas voltam com a mensagem de cada item sem impedir as demais.
 */
export function useCreateSuggestedCategories() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: async ({ type, names }: { type: CategoryType; names: string[] }): Promise<SuggestionsResult> => {
      const result: SuggestionsResult = { created: [], failures: [] }
      for (const name of names) {
        try {
          await categoriesApi.create({ name, type })
          result.created.push(name)
        } catch (error) {
          result.failures.push({ name, messages: errorMessages(error) })
        }
      }
      return result
    },
    onSettled: invalidate,
  })
}
