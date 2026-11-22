import { todayIso } from '@/lib/date'
import { fromCents, toCents } from '@/lib/money'
import { addMonths, currentMonth } from '@/lib/month'
import type { ResponseLedgerItem } from '@/types/api'

import { bodyOf, type Reply, type Routes } from './mock-api'

export type SeedLedgerItem = Partial<ResponseLedgerItem> &
  Pick<ResponseLedgerItem, 'source' | 'sourceId' | 'direction' | 'name' | 'month' | 'amount'>

const sumCents = (values: number[]) => values.reduce((total, value) => total + toCents(value), 0)

/**
 * Resumo mensal em memória (research.md §9): itens por mês, previsto/realizado somados dos itens,
 * pendências (itens em aberto de meses anteriores, só no mês atual com saldo inicial e sem filtro) e
 * acumulado a partir do saldo inicial (meses encerrados pelo realizado; atual e futuros pelo
 * previsto). Quitar/desfazer parcela, receita e ocorrência muda o item.
 */
export function summaryStore({
  items: seeds = [],
  openingBalance = null,
}: {
  items?: SeedLedgerItem[]
  /** Saldo inicial: valor e mês de referência ("yyyy-MM"). */
  openingBalance?: { amount: number; month: string } | null
}) {
  const items: ResponseLedgerItem[] = seeds.map((seed) => ({
    number: null,
    installmentsCount: null,
    category: null,
    date: `${seed.month}-10`,
    isSettled: false,
    settledAmount: null,
    settledOn: null,
    paidInAdvance: false,
    ...seed,
  }))

  const inMonth = (month: string, categoryId: number | null) =>
    items
      .filter((i) => i.month === month)
      .filter((i) => categoryId === null || i.category?.id === categoryId)
      .sort((a, b) => a.date.localeCompare(b.date))

  const totals = (month: string, categoryId: number | null) => {
    const list = inMonth(month, categoryId)
    const incomes = list.filter((i) => i.direction === 'Income')
    const expenses = list.filter((i) => i.direction === 'Expense')
    const forecastIn = sumCents(incomes.map((i) => i.amount))
    const forecastOut = sumCents(expenses.map((i) => i.amount))
    const received = sumCents(incomes.filter((i) => i.isSettled).map((i) => i.settledAmount ?? i.amount))
    const paid = sumCents(expenses.filter((i) => i.isSettled).map((i) => i.settledAmount ?? i.amount))
    return { incomes, expenses, forecastIn, forecastOut, received, paid }
  }

  const balanceOf = (month: string) => {
    const t = totals(month, null)
    return month < currentMonth() ? t.received - t.paid : t.forecastIn - t.forecastOut
  }

  const summary = (month: string, categoryId: number | null) => {
    const t = totals(month, categoryId)
    let pending = null
    if (openingBalance && categoryId === null && month === currentMonth()) {
      const open = items.filter((i) => i.month < month && i.month >= openingBalance.month && !i.isSettled)
      if (open.length) {
        pending = {
          toReceive: fromCents(sumCents(open.filter((i) => i.direction === 'Income').map((i) => i.amount))),
          toPay: fromCents(sumCents(open.filter((i) => i.direction === 'Expense').map((i) => i.amount))),
          items: open,
        }
      }
    }
    // Como a API: no mês atual, o acumulado também soma as pendências de meses anteriores.
    let accumulated = null
    if (openingBalance && categoryId === null && month >= openingBalance.month) {
      let previous = toCents(openingBalance.amount)
      for (let m = openingBalance.month; m < month; m = addMonths(m, 1)) previous += balanceOf(m)
      const pendingNet = pending ? toCents(pending.toReceive) - toCents(pending.toPay) : 0
      accumulated = { previousBalance: fromCents(previous), endBalance: fromCents(previous + balanceOf(month) + pendingNet) }
    }
    const [year, m] = month.split('-').map(Number)
    return {
      year,
      month: m,
      incomes: t.incomes,
      expenses: t.expenses,
      forecast: { incomes: fromCents(t.forecastIn), expenses: fromCents(t.forecastOut), balance: fromCents(t.forecastIn - t.forecastOut) },
      realized: { received: fromCents(t.received), paid: fromCents(t.paid), balance: fromCents(t.received - t.paid) },
      pending,
      accumulated,
      openingBalanceMissing: openingBalance === null,
    }
  }

  const settle = (item: ResponseLedgerItem | undefined, settled: boolean, on?: string): Reply => {
    if (!item) return { status: 404, body: { errors: ['Lançamento não encontrado.'] } }
    Object.assign(item, settled
      ? { isSettled: true, settledAmount: item.amount, settledOn: on ?? todayIso() }
      : { isSettled: false, settledAmount: null, settledOn: null })
    return { status: 200, body: {} }
  }

  const dispatch = (init: RequestInit, key: string): Reply | undefined => {
    const [method, rawPath] = key.split(' ')
    const [path, search = ''] = rawPath.split('?')
    const params = new URLSearchParams(search)
    const body = bodyOf(init) ?? {}
    let match: RegExpMatchArray | null

    if (method === 'GET' && path === '/summaries') {
      const month = `${params.get('year')}-${String(params.get('month')).padStart(2, '0')}`
      return { status: 200, body: summary(month, params.get('categoryId') ? Number(params.get('categoryId')) : null) }
    }
    if ((match = path.match(/^\/expenses\/(\d+)\/installments\/(\d+)\/payment$/))) {
      const item = items.find((i) => i.source === 'Installment' && i.sourceId === Number(match![1]) && i.number === Number(match![2]))
      return settle(item, method === 'POST', body.paidOn)
    }
    if ((match = path.match(/^\/incomes\/(\d+)\/receipt$/))) {
      const item = items.find((i) => i.source === 'Income' && i.sourceId === Number(match![1]))
      return settle(item, method === 'POST', body.receivedOn)
    }
    if ((match = path.match(/^\/recurrences\/(\d+)\/months\/(\d+)\/(\d+)\/settlement$/))) {
      const month = `${match[2]}-${match[3].padStart(2, '0')}`
      const item = items.find((i) => i.source === 'Recurrence' && i.sourceId === Number(match![1]) && i.month === month)
      return settle(item, method === 'POST', body.settledOn)
    }
    return undefined
  }

  const routes: Routes = { '*': dispatch }
  return { items, routes }
}
