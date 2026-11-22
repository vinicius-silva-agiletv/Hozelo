import { useMutation, useQueries, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import type { EntryKind, RequestRecurrence, RequestUpdateRecurrence, ResponseRecurrence } from '@/types/api'

import { recurrencesApi } from './api'

export function useRecurrences(kind: EntryKind) {
  return useQuery({
    queryKey: queryKeys.recurrenceList(kind),
    queryFn: () => recurrencesApi.list(kind),
    select: (data) => data.recurrences,
  })
}

export function useRecurrence(id: number | null) {
  return useQuery({
    queryKey: queryKeys.recurrence(id ?? 0),
    queryFn: () => recurrencesApi.get(id!),
    enabled: id !== null,
  })
}

/** Detalhes (meses e histórico) de várias recorrências, em paralelo e em cache (research.md §2). */
export function useRecurrenceDetails(ids: number[]) {
  return useQueries({
    queries: ids.map((id) => ({ queryKey: queryKeys.recurrence(id), queryFn: () => recurrencesApi.get(id) })),
    combine: (results) => ({
      byId: new Map(results.filter((r) => r.data).map((r) => [r.data!.id, r.data!])),
      isPending: results.some((r) => r.isPending),
    }),
  })
}

/** Depois de qualquer mudança: resumo, listas e a recorrência (gravada com a resposta). */
async function afterChange(client: QueryClient, recurrence?: ResponseRecurrence) {
  if (recurrence) client.setQueryData(queryKeys.recurrence(recurrence.id), recurrence)
  await Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.summary }),
    client.invalidateQueries({ queryKey: queryKeys.recurrences }),
  ])
}

export function useCreateRecurrence() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (request: RequestRecurrence) => recurrencesApi.create(request),
    onSuccess: (recurrence) => {
      void client.invalidateQueries({ queryKey: queryKeys.categories })
      return afterChange(client, recurrence)
    },
  })
}

export function useUpdateRecurrence(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (request: RequestUpdateRecurrence) => recurrencesApi.update(id, request),
    onSuccess: (recurrence) => {
      void client.invalidateQueries({ queryKey: queryKeys.categories })
      return afterChange(client, recurrence)
    },
  })
}

export function useDeleteRecurrence() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => recurrencesApi.remove(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.categories })
      return afterChange(client)
    },
  })
}

type RecurrenceAction =
  | { type: 'settle'; month: string; settledOn?: string }
  | { type: 'undoSettlement'; month: string }
  | { type: 'settleWithAmount'; month: string; amount: number; settledOn?: string }
  | { type: 'adjust'; month: string; amount: number }
  | { type: 'skip'; month: string }
  | { type: 'undoAdjustment'; month: string }
  | { type: 'changeAmount'; amount: number; fromMonth: string }
  | { type: 'end'; endMonth: string }
  | { type: 'reopen' }

async function run(id: number, action: RecurrenceAction): Promise<ResponseRecurrence> {
  switch (action.type) {
    case 'settle':
      return recurrencesApi.settle(id, action.month, action.settledOn)
    case 'undoSettlement':
      return recurrencesApi.undoSettlement(id, action.month)
    case 'settleWithAmount':
      // Ajusta o valor do mês e quita (clarify Q2); se a quitação falhar, o ajuste fica.
      await recurrencesApi.adjustMonth(id, action.month, { amount: action.amount, skipped: false })
      return recurrencesApi.settle(id, action.month, action.settledOn)
    case 'adjust':
      return recurrencesApi.adjustMonth(id, action.month, { amount: action.amount, skipped: false })
    case 'skip':
      return recurrencesApi.adjustMonth(id, action.month, { skipped: true })
    case 'undoAdjustment':
      return recurrencesApi.undoAdjustment(id, action.month)
    case 'changeAmount':
      return recurrencesApi.changeAmount(id, action.amount, action.fromMonth)
    case 'end':
      return recurrencesApi.end(id, action.endMonth)
    case 'reopen':
      return recurrencesApi.reopen(id)
  }
}

/** Ações sobre uma recorrência (ocorrência do mês ou a recorrência inteira; research.md §5, §6). */
export function useRecurrenceAction(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (action: RecurrenceAction) => run(id, action),
    onSuccess: (recurrence) => afterChange(client, recurrence),
    // Mesmo em erro (ex.: ajuste aplicado e quitação recusada), recarrega para mostrar o estado real.
    onError: () => afterChange(client),
  })
}
