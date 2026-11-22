import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { useCategories } from '@/features/categories/hooks'
import { peopleDependentKeys, queryKeys } from '@/lib/query-keys'
import type {
  ExpenseStatus,
  RequestAmortizeExpense,
  RequestRegisterExpense,
  RequestUpdateExpense,
  ResponseExpense,
  ResponseMonthlyInstallments,
} from '@/types/api'

import { expensesApi } from './api'

/** Categoria do endereço só vale se existir (Edge Cases: id desconhecido → todas). */
export function useValidCategoryId(categoryId: number | null) {
  const categories = useCategories('Expense')
  if (categoryId === null || !categories.data) return categoryId
  return categories.data.some((category) => category.id === categoryId) ? categoryId : null
}

export function useMonthlyInstallments(month: string, categoryId: number | null) {
  return useQuery({
    queryKey: queryKeys.monthlyInstallments(month, categoryId),
    queryFn: () => expensesApi.monthly(month, categoryId),
  })
}

export function useExpenses(categoryId: number | null, status: ExpenseStatus | null) {
  return useQuery({
    queryKey: queryKeys.expenseList({ categoryId, status }),
    queryFn: () => expensesApi.list(categoryId, status),
  })
}

export function useExpense(id: number | null) {
  return useQuery({
    queryKey: queryKeys.expense(id ?? 0),
    queryFn: () => expensesApi.get(id!),
    enabled: id !== null,
  })
}

/** Listas (mês e todas) sempre recarregadas da API depois de uma mudança (research.md §3). */
const refreshLists = (client: QueryClient) =>
  Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.installments }),
    client.invalidateQueries({ queryKey: queryKeys.expenses }),
    client.invalidateQueries({ queryKey: queryKeys.summary }),
    ...peopleDependentKeys.map((queryKey) => client.invalidateQueries({ queryKey })),
  ])

const storeExpense = (client: QueryClient, expense: ResponseExpense) =>
  client.setQueryData(queryKeys.expense(expense.id), expense)

export function useCreateExpense() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (request: RequestRegisterExpense) => expensesApi.create(request),
    onSuccess: (expense) => {
      storeExpense(client, expense)
      void client.invalidateQueries({ queryKey: queryKeys.categories })
      return refreshLists(client)
    },
  })
}

export function useUpdateExpense(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (request: RequestUpdateExpense) => expensesApi.update(id, request),
    onSuccess: (expense) => {
      storeExpense(client, expense)
      void client.invalidateQueries({ queryKey: queryKeys.categories })
      return refreshLists(client)
    },
  })
}

export function useDeleteExpense() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => expensesApi.remove(id),
    // O detalhe aberto continua montado até fechar (o cache da despesa não é removido aqui), para o
    // aviso e o fechamento rodarem; a entrada some sozinha do cache depois que ninguém a usa.
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.categories })
      return refreshLists(client)
    },
  })
}

interface PaymentVariables {
  expenseId: number
  number: number
  paid: boolean
  paidOn?: string
}

type Snapshot = [readonly unknown[], unknown][]

/**
 * Marcar/desmarcar parcela (research.md §4): a caixa muda na hora (só o `isPaid` da linha); os
 * totais vêm da API no recarregamento. Em erro, volta ao estado anterior.
 */
export function useInstallmentPayment() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ expenseId, number, paid, paidOn }: PaymentVariables) =>
      paid ? expensesApi.pay(expenseId, number, paidOn) : expensesApi.undoPayment(expenseId, number),
    onMutate: async ({ expenseId, number, paid }) => {
      await client.cancelQueries({ queryKey: queryKeys.installments })
      await client.cancelQueries({ queryKey: queryKeys.expense(expenseId) })
      const snapshot: Snapshot = [
        ...client.getQueriesData({ queryKey: queryKeys.installments }),
        [queryKeys.expense(expenseId), client.getQueryData(queryKeys.expense(expenseId))],
      ]

      client.setQueriesData<ResponseMonthlyInstallments>({ queryKey: queryKeys.installments }, (data) =>
        data && {
          ...data,
          installments: data.installments.map((item) =>
            item.expenseId === expenseId && item.number === number ? { ...item, isPaid: paid } : item,
          ),
        },
      )
      client.setQueryData<ResponseExpense>(queryKeys.expense(expenseId), (data) =>
        data && {
          ...data,
          installments: data.installments.map((item) => (item.number === number ? { ...item, isPaid: paid } : item)),
        },
      )
      return { snapshot }
    },
    onError: (_error, _variables, context) => {
      context?.snapshot.forEach(([key, data]) => client.setQueryData(key, data))
    },
    onSuccess: (expense) => storeExpense(client, expense),
    onSettled: () => refreshLists(client),
  })
}

export function useAmortizeExpense(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (request: RequestAmortizeExpense) => expensesApi.amortize(id, request),
    onSuccess: (expense) => {
      storeExpense(client, expense)
      return refreshLists(client)
    },
  })
}
