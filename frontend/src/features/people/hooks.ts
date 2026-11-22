import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { peopleDependentKeys, queryKeys } from '@/lib/query-keys'
import type { RequestPersonCharge, RequestPersonPayment } from '@/types/api'

import { peopleApi } from './api'

const byName = new Intl.Collator('pt-BR', { sensitivity: 'base' })

/** Pessoas cadastradas, em ordem alfabética (lista e seletores de divisão). */
export function usePeople() {
  return useQuery({
    queryKey: queryKeys.people,
    queryFn: peopleApi.list,
    select: (data) => [...data.people].sort((a, b) => byName.compare(a.name, b.name)),
  })
}

export function usePersonStatement(id: number, month: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.personStatement(id, month),
    queryFn: () => peopleApi.statement(id, month),
    enabled,
  })
}

export function usePersonSummary(id: number, enabled = true) {
  return useQuery({ queryKey: queryKeys.personSummary(id), queryFn: () => peopleApi.summary(id), enabled })
}

/** Depois de qualquer mudança: pessoas, extratos, resumos e o resumo do mês (reembolsos em Receitas). */
const refresh = (client: QueryClient) =>
  Promise.all([...peopleDependentKeys, queryKeys.summary].map((queryKey) => client.invalidateQueries({ queryKey })))

export function useCreatePerson() {
  const client = useQueryClient()
  return useMutation({ mutationFn: (name: string) => peopleApi.create({ name }), onSuccess: () => refresh(client) })
}

export function useRenamePerson(id: number) {
  const client = useQueryClient()
  return useMutation({ mutationFn: (name: string) => peopleApi.rename(id, { name }), onSuccess: () => refresh(client) })
}

export function useDeletePerson() {
  const client = useQueryClient()
  return useMutation({ mutationFn: (id: number) => peopleApi.remove(id), onSuccess: () => refresh(client) })
}

export function useSavePayment(personId: number, paymentId: number | null) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (request: RequestPersonPayment) =>
      paymentId === null ? peopleApi.createPayment(personId, request) : peopleApi.updatePayment(personId, paymentId, request),
    onSuccess: () => refresh(client),
  })
}

export function useDeletePayment(personId: number) {
  const client = useQueryClient()
  return useMutation({ mutationFn: (paymentId: number) => peopleApi.removePayment(personId, paymentId), onSuccess: () => refresh(client) })
}

export function useSaveCharge(personId: number, chargeId: number | null) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (request: RequestPersonCharge) =>
      chargeId === null ? peopleApi.createCharge(personId, request) : peopleApi.updateCharge(personId, chargeId, request),
    onSuccess: () => refresh(client),
  })
}

export function useDeleteCharge(personId: number) {
  const client = useQueryClient()
  return useMutation({ mutationFn: (chargeId: number) => peopleApi.removeCharge(personId, chargeId), onSuccess: () => refresh(client) })
}
