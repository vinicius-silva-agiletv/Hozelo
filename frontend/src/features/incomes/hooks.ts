import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import type { RequestIncome, RequestUpdateIncome, ResponseIncome } from '@/types/api'

import { incomesApi } from './api'

export function useIncome(id: number | null) {
  return useQuery({
    queryKey: queryKeys.income(id ?? 0),
    queryFn: () => incomesApi.get(id!),
    enabled: id !== null,
  })
}

async function afterChange(client: QueryClient, income?: ResponseIncome) {
  if (income) client.setQueryData(queryKeys.income(income.id), income)
  await Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.summary }),
    client.invalidateQueries({ queryKey: queryKeys.incomes }),
  ])
}

export function useCreateIncome() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (request: RequestIncome) => incomesApi.create(request),
    onSuccess: (income) => {
      void client.invalidateQueries({ queryKey: queryKeys.categories })
      return afterChange(client, income)
    },
  })
}

export function useUpdateIncome(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (request: RequestUpdateIncome) => incomesApi.update(id, request),
    onSuccess: (income) => {
      void client.invalidateQueries({ queryKey: queryKeys.categories })
      return afterChange(client, income)
    },
  })
}

export function useDeleteIncome() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => incomesApi.remove(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.categories })
      return afterChange(client)
    },
  })
}

export function useIncomeReceipt(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ received, receivedOn }: { received: boolean; receivedOn?: string }) =>
      received ? incomesApi.receive(id, receivedOn) : incomesApi.undoReceipt(id),
    onSuccess: (income) => afterChange(client, income),
  })
}
