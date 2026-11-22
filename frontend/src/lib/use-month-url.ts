import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

import { currentMonth, isWithinRange } from '@/lib/month'

const positiveInt = (value: string | null) => {
  if (!value || !/^\d+$/.test(value)) return null
  const number = Number(value)
  return number > 0 ? number : null
}

const validMonth = (value: string | null) =>
  value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && isWithinRange(value) ? value : null

const DETAIL_STATE = 'monthUrlDetail'

/**
 * Mês, categoria e item aberto no endereço (research.md §3 da 008, generalizado da 007): `mes`
 * (padrão o mês atual), `categoria` e um parâmetro por tipo de item aberto (ex.: `receita`,
 * `recorrencia`). Mês e filtro trocam com `replace`; abrir um item entra no histórico, e fechar
 * volta (no celular, "voltar" fecha o painel).
 */
export function useMonthUrl() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

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

  const fromPush = (location.state as Record<string, unknown> | null)?.[DETAIL_STATE] === true

  return {
    month: validMonth(params.get('mes')) ?? currentMonth(),
    categoryId: positiveInt(params.get('categoria')),
    opened: (param: string) => positiveInt(params.get(param)),
    setMonth: (next: string) => update({ mes: next === currentMonth() ? null : next }),
    setCategoryId: (next: number | null) => update({ categoria: next === null ? null : String(next) }),
    open: (param: string, id: number) => update({ [param]: String(id) }, { push: true, state: { [DETAIL_STATE]: true } }),
    close: (param: string) => {
      if (fromPush) navigate(-1)
      else update({ [param]: null })
    },
  }
}
