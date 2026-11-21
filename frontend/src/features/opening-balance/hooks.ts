import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'

import { openingBalanceApi } from './api'

export function useOpeningBalance() {
  return useQuery({ queryKey: queryKeys.openingBalance, queryFn: openingBalanceApi.get })
}

export function useSaveOpeningBalance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: openingBalanceApi.save,
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.openingBalance, saved)
      return queryClient.invalidateQueries({ queryKey: queryKeys.openingBalance })
    },
  })
}
