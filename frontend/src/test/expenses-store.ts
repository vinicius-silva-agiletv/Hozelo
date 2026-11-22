import { installmentDueDate, splitInstallments } from '@/features/expenses/preview'
import { todayIso } from '@/lib/date'
import { fromCents, toCents } from '@/lib/money'
import type {
  CategorySummary,
  PersonSummary,
  RequestAmortizeExpense,
  RequestRegisterExpense,
  ResponseExpense,
  ResponseInstallment,
  ResponseMonthlyInstallment,
  ResponsePerson,
} from '@/types/api'

import { bodyOf, type Reply, type Routes } from './mock-api'

interface StoredExpense {
  id: number
  name: string
  category: CategorySummary
  amountType: 'Total' | 'Installment'
  isInstallment: boolean
  notes: string | null
  person: PersonSummary | null
  personPercent: number | null
  firstDueDate: string
  installments: ResponseInstallment[]
}

export interface SeedExpense {
  name: string
  categoryId: number
  amount: number
  amountType?: 'Total' | 'Installment'
  installmentsCount?: number
  firstDueDate: string
  alreadyPaidInstallments?: number
  notes?: string | null
  personId?: number | null
  personPercent?: number | null
}

const monthOf = (iso: string) => iso.slice(0, 7)

/**
 * Despesas em memória que respondem como a API (research.md §11): geração de parcelas, visão do
 * mês (com antecipadas), lista com filtros, detalhe, cadastro/edição/remoção, pagar/desfazer e
 * amortização. As regras seguem a feature 002 o suficiente para testar os fluxos da tela.
 */
export function expensesStore({
  categories,
  people = [],
  expenses = [],
}: {
  categories: CategorySummary[]
  people?: ResponsePerson[]
  expenses?: SeedExpense[]
}) {
  let nextId = 1
  const items: StoredExpense[] = []

  const findCategory = (id: number) => categories.find((c) => c.id === id)
  const findPerson = (id: number | null | undefined) => {
    const person = people.find((p) => p.id === id)
    return person ? { id: person.id, name: person.name } : null
  }

  const buildInstallments = (request: SeedExpense | RequestRegisterExpense, alreadyPaid: number) => {
    const count = request.installmentsCount ?? 1
    const cents = toCents(request.amount)
    const split =
      (request.amountType ?? 'Total') === 'Total' ? splitInstallments(cents, count) : { installment: cents, last: cents }
    return Array.from({ length: count }, (_, index): ResponseInstallment => {
      const number = index + 1
      const amount = fromCents(number === count ? split.last : split.installment)
      const dueDate = installmentDueDate(request.firstDueDate, number)
      const paid = number <= alreadyPaid
      return { number, dueDate, amount, isPaid: paid, paidOn: paid ? dueDate : null, paidAmount: paid ? amount : null, prepaid: false }
    })
  }

  const register = (request: SeedExpense | RequestRegisterExpense) => {
    const category = findCategory(request.categoryId)!
    const expense: StoredExpense = {
      id: nextId++,
      name: request.name.trim(),
      category: { id: category.id, name: category.name },
      amountType: request.amountType ?? 'Total',
      isInstallment: (request.installmentsCount ?? 1) > 1,
      notes: request.notes ?? null,
      person: findPerson(request.personId),
      personPercent: request.personId ? (request.personPercent ?? 100) : null,
      firstDueDate: request.firstDueDate,
      installments: buildInstallments(request, request.alreadyPaidInstallments ?? 0),
    }
    items.push(expense)
    return expense
  }

  expenses.forEach(register)

  const sum = (values: number[]) => fromCents(values.reduce((total, value) => total + toCents(value), 0))

  const toResponse = (expense: StoredExpense): ResponseExpense => {
    const { installments } = expense
    const open = installments.filter((i) => !i.isPaid)
    const prepaid = installments.filter((i) => i.prepaid)
    const total = sum(installments.map((i) => i.amount))
    return {
      id: expense.id,
      name: expense.name,
      category: expense.category,
      amountType: expense.amountType,
      totalAmount: total,
      installmentAmount: installments[0].amount,
      isInstallment: expense.isInstallment,
      installmentsCount: installments.length,
      paidInstallments: installments.length - open.length,
      remainingInstallments: open.length,
      firstDueDate: installments[0].dueDate,
      lastDueDate: installments[installments.length - 1].dueDate,
      nextDueDate: open[0]?.dueDate ?? null,
      paidAmount: sum(installments.filter((i) => i.isPaid).map((i) => i.paidAmount ?? i.amount)),
      discountAmount: sum(prepaid.map((i) => i.amount - (i.paidAmount ?? i.amount))),
      remainingAmount: sum(open.map((i) => i.amount)),
      status: open.length === 0 ? 'Paid' : 'Open',
      notes: expense.notes,
      person: expense.person,
      personPercent: expense.personPercent,
      installments: installments.map((i) => ({ ...i })),
    }
  }

  const ok = (body: unknown, status = 200): Reply => ({ status, body })
  const fail = (status: number, ...errors: string[]): Reply => ({ status, body: { errors } })
  const notFound = () => fail(404, 'Despesa não encontrada.')

  const monthly = (params: URLSearchParams): Reply => {
    const year = Number(params.get('year'))
    const month = Number(params.get('month'))
    const target = `${year}-${String(month).padStart(2, '0')}`
    const categoryId = params.get('categoryId') ? Number(params.get('categoryId')) : null

    const rows: (ResponseMonthlyInstallment & { sortDate: string })[] = []
    for (const expense of items) {
      if (categoryId !== null && expense.category.id !== categoryId) continue
      for (const installment of expense.installments) {
        const paidInAdvance = installment.isPaid && !!installment.paidOn && monthOf(installment.paidOn) < monthOf(installment.dueDate)
        const shownMonth = paidInAdvance ? monthOf(installment.paidOn!) : monthOf(installment.dueDate)
        if (shownMonth !== target) continue
        rows.push({
          expenseId: expense.id,
          expenseName: expense.name,
          category: expense.category,
          number: installment.number,
          installmentsCount: expense.installments.length,
          dueDate: installment.dueDate,
          amount: installment.amount,
          isPaid: installment.isPaid,
          paidOn: installment.paidOn,
          paidAmount: installment.paidAmount,
          prepaid: installment.prepaid,
          paidInAdvance,
          sortDate: paidInAdvance ? installment.paidOn! : installment.dueDate,
        })
      }
    }
    rows.sort((a, b) => a.sortDate.localeCompare(b.sortDate))
    const installments: ResponseMonthlyInstallment[] = rows.map((row) => {
      const copy: Partial<typeof row> = { ...row }
      delete copy.sortDate
      return copy as ResponseMonthlyInstallment
    })
    return ok({
      year,
      month,
      // Como a API: total = soma das parcelas; pago = soma do efetivamente pago (com desconto).
      totalAmount: sum(installments.map((i) => i.amount)),
      paidAmount: sum(installments.filter((i) => i.isPaid).map((i) => i.paidAmount ?? i.amount)),
      openAmount: sum(installments.filter((i) => !i.isPaid).map((i) => i.amount)),
      installments,
    })
  }

  const list = (params: URLSearchParams): Reply => {
    const categoryId = params.get('categoryId') ? Number(params.get('categoryId')) : null
    const status = params.get('status')
    const expenses = items
      .map(toResponse)
      .filter((e) => categoryId === null || e.category.id === categoryId)
      .filter((e) => !status || e.status === status)
      .sort((a, b) => (a.nextDueDate ?? '9999').localeCompare(b.nextDueDate ?? '9999'))
      .map((expense) => {
        const short: Omit<ResponseExpense, 'installments'> & { installments?: unknown } = { ...expense }
        delete short.installments
        return short as Omit<ResponseExpense, 'installments'>
      })
    return ok({
      totalPaidAmount: sum(expenses.map((e) => e.paidAmount)),
      totalRemainingAmount: sum(expenses.map((e) => e.remainingAmount)),
      totalDiscountAmount: sum(expenses.map((e) => e.discountAmount)),
      expenses,
    })
  }

  const validate = (request: RequestRegisterExpense) => {
    const errors: string[] = []
    if (!request.name?.trim()) errors.push('O nome da despesa é obrigatório.')
    if (!findCategory(request.categoryId)) errors.push('Categoria não encontrada.')
    if (!(request.amount > 0)) errors.push('O valor deve ser maior que zero.')
    return errors
  }

  const dispatch = (init: RequestInit, key: string): Reply | undefined => {
    const [method, rawPath] = key.split(' ')
    const [path, search = ''] = rawPath.split('?')
    const params = new URLSearchParams(search)
    const body = bodyOf(init)
    let match: RegExpMatchArray | null

    if (method === 'GET' && path === '/installments') return monthly(params)
    if (method === 'GET' && path === '/expenses') return list(params)
    if (method === 'GET' && path === '/people') return ok({ people })

    if (method === 'POST' && path === '/expenses') {
      const errors = validate(body)
      if (errors.length) return fail(400, ...errors)
      return ok(toResponse(register(body)), 201)
    }

    if ((match = path.match(/^\/expenses\/(\d+)$/))) {
      const expense = items.find((e) => e.id === Number(match![1]))
      if (!expense) return notFound()
      if (method === 'GET') return ok(toResponse(expense))
      if (method === 'DELETE') {
        items.splice(items.indexOf(expense), 1)
        return { status: 204 }
      }
      if (method === 'PUT') {
        const errors = validate(body)
        if (errors.length) return fail(400, ...errors)
        if (expense.installments.some((i) => i.prepaid)) {
          return fail(400, 'A despesa possui parcelas amortizadas. Desfaça a amortização antes de editar.')
        }
        const paidBefore = expense.installments.filter((i) => i.isPaid).length
        if ((body.installmentsCount ?? 1) < paidBefore) {
          return fail(400, 'A quantidade de parcelas não pode ser menor que as parcelas já pagas.')
        }
        const category = findCategory(body.categoryId)!
        Object.assign(expense, {
          name: body.name.trim(),
          category: { id: category.id, name: category.name },
          amountType: body.amountType,
          isInstallment: body.isInstallment,
          notes: body.notes,
          person: findPerson(body.personId),
          personPercent: body.personId ? body.personPercent : null,
          firstDueDate: body.firstDueDate,
          installments: buildInstallments(body, paidBefore),
        })
        return ok(toResponse(expense))
      }
    }

    if ((match = path.match(/^\/expenses\/(\d+)\/installments\/(\d+)\/payment$/))) {
      const expense = items.find((e) => e.id === Number(match![1]))
      const installment = expense?.installments.find((i) => i.number === Number(match![2]))
      if (!expense || !installment) return notFound()
      if (method === 'POST') {
        const paidOn = body?.paidOn ?? todayIso()
        if (paidOn > todayIso()) return fail(400, 'A data do pagamento não pode ser futura.')
        Object.assign(installment, { isPaid: true, paidOn, paidAmount: installment.amount, prepaid: false })
      } else {
        Object.assign(installment, { isPaid: false, paidOn: null, paidAmount: null, prepaid: false })
      }
      return ok(toResponse(expense))
    }

    if ((match = path.match(/^\/expenses\/(\d+)\/amortizations$/)) && method === 'POST') {
      const expense = items.find((e) => e.id === Number(match![1]))
      if (!expense) return notFound()
      const request = body as RequestAmortizeExpense
      const open = expense.installments.filter((i) => !i.isPaid)
      const chosen = request.installmentNumbers
        ? open.filter((i) => request.installmentNumbers!.includes(i.number))
        : open.slice(open.length - (request.quantity ?? 0))
      if (chosen.length === 0) return fail(400, 'Escolha ao menos uma parcela em aberto.')
      const sumCents = chosen.reduce((total, i) => total + toCents(i.amount), 0)
      const paidCents = toCents(request.paidAmount)
      if (paidCents <= 0 || paidCents > sumCents) return fail(400, 'O valor pago deve ser maior que zero e no máximo a soma das parcelas.')
      const paidOn = request.paidOn ?? todayIso()
      let remaining = paidCents
      chosen.forEach((installment, index) => {
        const share = index === chosen.length - 1 ? remaining : Math.round((toCents(installment.amount) * paidCents) / sumCents)
        remaining -= share
        Object.assign(installment, { isPaid: true, paidOn, paidAmount: fromCents(share), prepaid: true })
      })
      return ok(toResponse(expense))
    }

    return undefined
  }

  const routes: Routes = { '*': dispatch }
  return { items, routes, toResponse }
}
