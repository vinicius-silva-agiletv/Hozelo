import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

import { currentMonth, isWithinRange } from '@/lib/month'
import type { ExpenseStatus } from '@/types/api'

export type ExpensesTab = 'mes' | 'todas'

const statusFromParam: Record<string, ExpenseStatus> = { abertas: 'Open', quitadas: 'Paid' }
const statusToParam: Record<ExpenseStatus, string> = { Open: 'abertas', Paid: 'quitadas' }

const positiveInt = (value: string | null) => {
  if (!value || !/^\d+$/.test(value)) return null
  const number = Number(value)
  return number > 0 ? number : null
}

const validMonth = (value: string | null) =>
  value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && isWithinRange(value) ? value : null

const DETAIL_STATE = 'expenseDetail'

/**
 * Estado da tela no endereço (data-model.md "Estado no endereço", research.md §2): aba, mês,
 * categoria, situação e despesa aberta. Mês e filtros trocam com `replace`; abrir o detalhe entra
 * no histórico, então "voltar" fecha o detalhe.
 */
export function useExpensesUrl() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const tab: ExpensesTab = params.get('aba') === 'todas' ? 'todas' : 'mes'
  const month = validMonth(params.get('mes')) ?? currentMonth()
  const categoryId = positiveInt(params.get('categoria'))
  const status = statusFromParam[params.get('situacao') ?? ''] ?? null
  const expenseId = positiveInt(params.get('despesa'))

  const update = useCallback(
    (changes: Record<string, string | null>, options: { push?: boolean; state?: unknown } = {}) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(changes)) {
            if (value === null) next.delete(key)
            else next.set(key, value)
          }
          return next
        },
        { replace: !options.push, state: options.state },
      )
    },
    [setParams],
  )

  const fromDetailPush = (location.state as Record<string, unknown> | null)?.[DETAIL_STATE] === true

  return {
    tab,
    month,
    categoryId,
    status,
    expenseId,
    setTab: (next: ExpensesTab) => update({ aba: next === 'mes' ? null : next }),
    setMonth: (next: string) => update({ mes: next === currentMonth() ? null : next }),
    setCategoryId: (next: number | null) => update({ categoria: next === null ? null : String(next) }),
    setStatus: (next: ExpenseStatus | null) => update({ situacao: next === null ? null : statusToParam[next] }),
    openExpense: (id: number) => update({ despesa: String(id) }, { push: true, state: { [DETAIL_STATE]: true } }),
    closeExpense: () => {
      if (fromDetailPush) navigate(-1)
      else update({ despesa: null })
    },
  }
}
