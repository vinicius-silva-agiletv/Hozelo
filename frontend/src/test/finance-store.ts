import { normalAmount } from '@/features/recurrences/occurrence'
import { isAfterToday, lastDayOfMonth, todayIso } from '@/lib/date'
import { fromCents, toCents } from '@/lib/money'
import { currentMonth } from '@/lib/month'
import type {
  CategorySummary,
  EntryKind,
  ResponseIncome,
  ResponseLedgerItem,
  ResponsePerson,
  ResponseRecurrence,
  ResponseRecurrenceMonth,
} from '@/types/api'

import { bodyOf, type Reply, type Routes } from './mock-api'

export interface SeedIncome {
  name: string
  categoryId: number
  amount: number
  expectedDate: string
  receivedOn?: string | null
  notes?: string | null
}

export interface SeedRecurrence {
  kind: EntryKind
  name: string
  categoryId: number
  amount: number
  dayOfMonth: number
  startMonth: string
  endMonth?: string | null
  amounts?: { fromMonth: string; amount: number }[]
  months?: ResponseRecurrenceMonth[]
  notes?: string | null
  personId?: number | null
  personPercent?: number | null
}

export interface SeedReimbursement {
  month: string
  name: string
  amount: number
  date: string
  settled?: boolean
  /** Pago parcialmente (a API marca como quitado com o valor pago menor). */
  settledAmount?: number
}

const sum = (values: number[]) => fromCents(values.reduce((total, value) => total + toCents(value), 0))
const dateIn = (month: string, day: number) => {
  const [year, m] = month.split('-').map(Number)
  return `${month}-${String(Math.min(day, lastDayOfMonth(year, m))).padStart(2, '0')}`
}

/**
 * Receitas avulsas, recorrências e o resumo mensal em memória (research.md §9), com as regras da
 * feature 003 que as telas usam: ocorrência por mês (pulada fica fora), valor do mês (ajuste ou
 * histórico), quitação, encerramento e reembolsos semeados como itens prontos.
 */
export function financeStore({
  categories,
  people = [],
  incomes = [],
  recurrences = [],
  reimbursements = [],
}: {
  categories: (CategorySummary & { type: 'Expense' | 'Income' })[]
  people?: ResponsePerson[]
  incomes?: SeedIncome[]
  recurrences?: SeedRecurrence[]
  reimbursements?: SeedReimbursement[]
}) {
  let nextIncomeId = 1
  let nextRecurrenceId = 1
  const incomeItems: ResponseIncome[] = []
  const recurrenceItems: ResponseRecurrence[] = []

  const category = (id: number) => {
    const found = categories.find((c) => c.id === id)
    return found ? { id: found.id, name: found.name } : null
  }
  const person = (id: number | null | undefined) => {
    const found = people.find((p) => p.id === id)
    return found ? { id: found.id, name: found.name } : null
  }

  const refresh = (recurrence: ResponseRecurrence) => {
    recurrence.months = recurrence.months.filter((m) => m.amount !== null || m.skipped || m.settledOn !== null)
    recurrence.currentAmount = normalAmount({ ...recurrence, currentAmount: recurrence.amounts[0]?.amount ?? 0 }, currentMonth())
    recurrence.isActive = recurrence.endMonth === null || recurrence.endMonth >= currentMonth()
    return recurrence
  }

  const addIncome = (seed: SeedIncome) => {
    const income: ResponseIncome = {
      id: nextIncomeId++,
      name: seed.name.trim(),
      category: category(seed.categoryId)!,
      amount: seed.amount,
      expectedDate: seed.expectedDate,
      isReceived: !!seed.receivedOn,
      receivedOn: seed.receivedOn ?? null,
      notes: seed.notes ?? null,
    }
    incomeItems.push(income)
    return income
  }

  const addRecurrence = (seed: SeedRecurrence) => {
    const recurrence: ResponseRecurrence = {
      id: nextRecurrenceId++,
      kind: seed.kind,
      name: seed.name.trim(),
      category: category(seed.categoryId)!,
      dayOfMonth: seed.dayOfMonth,
      startMonth: seed.startMonth,
      endMonth: seed.endMonth ?? null,
      isActive: true,
      currentAmount: seed.amount,
      notes: seed.notes ?? null,
      person: person(seed.personId),
      personPercent: seed.personId ? (seed.personPercent ?? 100) : null,
      amounts: seed.amounts ?? [{ fromMonth: seed.startMonth, amount: seed.amount }],
      months: seed.months ?? [],
    }
    recurrenceItems.push(refresh(recurrence))
    return recurrence
  }

  incomes.forEach(addIncome)
  recurrences.forEach(addRecurrence)

  const recurrenceItem = (recurrence: ResponseRecurrence, month: string): ResponseLedgerItem | null => {
    if (recurrence.startMonth > month || (recurrence.endMonth !== null && month > recurrence.endMonth)) return null
    const record = recurrence.months.find((m) => m.month === month)
    if (record?.skipped) return null
    const amount = record?.amount ?? normalAmount(recurrence, month)
    return {
      source: 'Recurrence',
      sourceId: recurrence.id,
      direction: recurrence.kind,
      number: null,
      installmentsCount: null,
      name: recurrence.name,
      category: recurrence.category,
      month,
      date: dateIn(month, recurrence.dayOfMonth),
      amount,
      isSettled: !!record?.settledOn,
      settledAmount: record?.settledOn ? amount : null,
      settledOn: record?.settledOn ?? null,
      paidInAdvance: false,
    }
  }

  const summary = (params: URLSearchParams): Reply => {
    const year = Number(params.get('year'))
    const month = Number(params.get('month'))
    const target = `${year}-${String(month).padStart(2, '0')}`
    const categoryId = params.get('categoryId') ? Number(params.get('categoryId')) : null
    const inCategory = (item: ResponseLedgerItem) => categoryId === null || item.category?.id === categoryId

    const incomeLedger: ResponseLedgerItem[] = [
      ...incomeItems
        .filter((income) => income.expectedDate.slice(0, 7) === target)
        .map((income): ResponseLedgerItem => ({
          source: 'Income',
          sourceId: income.id,
          direction: 'Income',
          number: null,
          installmentsCount: null,
          name: income.name,
          category: income.category,
          month: target,
          date: income.expectedDate,
          amount: income.amount,
          isSettled: income.isReceived,
          settledAmount: income.isReceived ? income.amount : null,
          settledOn: income.receivedOn,
          paidInAdvance: false,
        })),
      ...recurrenceItems.filter((r) => r.kind === 'Income').map((r) => recurrenceItem(r, target)).filter((i) => i !== null),
      ...(categoryId === null
        ? reimbursements
            .filter((r) => r.month === target)
            .map((r, index): ResponseLedgerItem => ({
              source: 'Reimbursement',
              sourceId: 900 + index,
              direction: 'Income',
              number: null,
              installmentsCount: null,
              name: r.name,
              category: null,
              month: target,
              date: r.date,
              amount: r.amount,
              isSettled: !!r.settled || r.settledAmount !== undefined,
              settledAmount: r.settledAmount ?? (r.settled ? r.amount : null),
              settledOn: r.settled ? r.date : null,
              paidInAdvance: false,
            }))
        : []),
    ]
      .filter(inCategory)
      .sort((a, b) => a.date.localeCompare(b.date))

    const expenseLedger = recurrenceItems
      .filter((r) => r.kind === 'Expense')
      .map((r) => recurrenceItem(r, target))
      .filter((i): i is ResponseLedgerItem => i !== null)
      .filter(inCategory)
      .sort((a, b) => a.date.localeCompare(b.date))

    const forecastIncomes = sum(incomeLedger.map((i) => i.amount))
    const forecastExpenses = sum(expenseLedger.map((i) => i.amount))
    const received = sum(incomeLedger.filter((i) => i.isSettled).map((i) => i.settledAmount ?? i.amount))
    const paid = sum(expenseLedger.filter((i) => i.isSettled).map((i) => i.settledAmount ?? i.amount))
    return {
      status: 200,
      body: {
        year,
        month,
        incomes: incomeLedger,
        expenses: expenseLedger,
        forecast: { incomes: forecastIncomes, expenses: forecastExpenses, balance: fromCents(toCents(forecastIncomes) - toCents(forecastExpenses)) },
        realized: { received, paid, balance: fromCents(toCents(received) - toCents(paid)) },
        pending: null,
        accumulated: null,
        openingBalanceMissing: true,
      },
    }
  }

  const ok = (body: unknown, status = 200): Reply => ({ status, body })
  const fail = (status: number, ...errors: string[]): Reply => ({ status, body: { errors } })

  const validateRecurrence = (body: Record<string, unknown>, creating: boolean) => {
    const errors: string[] = []
    if (!String(body.name ?? '').trim()) errors.push('O nome é obrigatório.')
    if (!category(Number(body.categoryId))) errors.push('Categoria não encontrada.')
    const day = Number(body.dayOfMonth)
    if (!(Number.isInteger(day) && day >= 1 && day <= 31)) errors.push('O dia do mês deve estar entre 1 e 31.')
    if (creating && !(Number(body.amount) > 0)) errors.push('O valor deve ser maior que zero.')
    if (creating && body.endMonth && String(body.endMonth) < String(body.startMonth)) errors.push('O fim não pode ser antes do início.')
    return errors
  }

  const short = (recurrence: ResponseRecurrence) => {
    const copy: Partial<ResponseRecurrence> = { ...recurrence }
    delete copy.amounts
    delete copy.months
    return copy
  }

  const dispatch = (init: RequestInit, key: string): Reply | undefined => {
    const [method, rawPath] = key.split(' ')
    const [path, search = ''] = rawPath.split('?')
    const params = new URLSearchParams(search)
    const body = bodyOf(init) ?? {}
    let match: RegExpMatchArray | null

    if (method === 'GET' && path === '/summaries') return summary(params)
    if (method === 'GET' && path === '/people') return ok({ people })

    // Receitas avulsas
    if (method === 'POST' && path === '/incomes') {
      const errors: string[] = []
      if (!String(body.name ?? '').trim()) errors.push('O nome é obrigatório.')
      if (!category(Number(body.categoryId))) errors.push('Categoria não encontrada.')
      if (!(Number(body.amount) > 0)) errors.push('O valor deve ser maior que zero.')
      if (body.receivedOn && isAfterToday(body.receivedOn)) errors.push('A data de recebimento não pode ser futura.')
      if (errors.length) return fail(400, ...errors)
      return ok(addIncome(body), 201)
    }
    if ((match = path.match(/^\/incomes\/(\d+)(\/receipt)?$/))) {
      const income = incomeItems.find((i) => i.id === Number(match![1]))
      if (!income) return fail(404, 'Receita não encontrada.')
      if (match[2]) {
        if (method === 'POST') {
          const receivedOn = body.receivedOn ?? todayIso()
          if (isAfterToday(receivedOn)) return fail(400, 'A data de recebimento não pode ser futura.')
          Object.assign(income, { isReceived: true, receivedOn })
        } else Object.assign(income, { isReceived: false, receivedOn: null })
        return ok(income)
      }
      if (method === 'GET') return ok(income)
      if (method === 'DELETE') {
        incomeItems.splice(incomeItems.indexOf(income), 1)
        return { status: 204 }
      }
      if (method === 'PUT') {
        Object.assign(income, {
          name: String(body.name).trim(),
          category: category(Number(body.categoryId)),
          amount: body.amount,
          expectedDate: body.expectedDate,
          notes: body.notes ?? null,
        })
        return ok(income)
      }
    }

    // Recorrências
    if (method === 'GET' && path === '/recurrences') {
      const kind = params.get('kind')
      return ok({ recurrences: recurrenceItems.filter((r) => !kind || r.kind === kind).map(short) })
    }
    if (method === 'POST' && path === '/recurrences') {
      const errors = validateRecurrence(body, true)
      if (errors.length) return fail(400, ...errors)
      return ok(addRecurrence(body), 201)
    }
    if ((match = path.match(/^\/recurrences\/(\d+)(\/.*)?$/))) {
      const recurrence = recurrenceItems.find((r) => r.id === Number(match![1]))
      if (!recurrence) return fail(404, 'Recorrência não encontrada.')
      const rest = match[2] ?? ''
      if (rest === '') {
        if (method === 'GET') return ok(recurrence)
        if (method === 'DELETE') {
          recurrenceItems.splice(recurrenceItems.indexOf(recurrence), 1)
          return { status: 204 }
        }
        if (method === 'PUT') {
          const errors = validateRecurrence(body, false)
          if (errors.length) return fail(400, ...errors)
          Object.assign(recurrence, {
            name: String(body.name).trim(),
            category: category(Number(body.categoryId)),
            dayOfMonth: body.dayOfMonth,
            notes: body.notes ?? null,
            person: person(body.personId),
            personPercent: body.personId ? (body.personPercent ?? 100) : null,
          })
          return ok(refresh(recurrence))
        }
      }
      if (rest === '/amount' && method === 'PUT') {
        if (body.fromMonth < recurrence.startMonth) return fail(400, 'O mês não pode ser antes do início.')
        recurrence.amounts = [...recurrence.amounts.filter((a) => a.fromMonth !== body.fromMonth), { fromMonth: body.fromMonth, amount: body.amount }]
          .sort((a, b) => a.fromMonth.localeCompare(b.fromMonth))
        return ok(refresh(recurrence))
      }
      if (rest === '/end') {
        if (method === 'PUT') {
          if (body.endMonth < recurrence.startMonth) return fail(400, 'O fim não pode ser antes do início.')
          recurrence.endMonth = body.endMonth
        } else recurrence.endMonth = null
        return ok(refresh(recurrence))
      }
      const monthMatch = rest.match(/^\/months\/(\d+)\/(\d+)(\/settlement)?$/)
      if (monthMatch) {
        const month = `${monthMatch[1]}-${monthMatch[2].padStart(2, '0')}`
        let record = recurrence.months.find((m) => m.month === month)
        if (!record) {
          record = { month, amount: null, skipped: false, settledOn: null }
          recurrence.months.push(record)
        }
        if (monthMatch[3]) {
          if (method === 'POST') {
            if (record.skipped) return fail(400, 'Mês pulado não pode ser quitado.')
            const settledOn = body.settledOn ?? todayIso()
            if (isAfterToday(settledOn)) return fail(400, 'A data não pode ser futura.')
            record.settledOn = settledOn
          } else record.settledOn = null
        } else if (method === 'PUT') {
          Object.assign(record, { amount: body.skipped ? null : (body.amount ?? null), skipped: !!body.skipped })
          if (body.skipped) record.settledOn = null
        } else Object.assign(record, { amount: null, skipped: false })
        recurrence.months.sort((a, b) => a.month.localeCompare(b.month))
        return ok(refresh(recurrence))
      }
    }
    return undefined
  }

  const routes: Routes = { '*': dispatch }
  return { incomes: incomeItems, recurrences: recurrenceItems, routes }
}
