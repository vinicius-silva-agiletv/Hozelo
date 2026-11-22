import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'

import { peopleApi } from './api'

/** Pessoas cadastradas (para escolher com quem dividir uma despesa). */
export function usePeople() {
  return useQuery({ queryKey: queryKeys.people, queryFn: peopleApi.list, select: (data) => data.people })
}
