import { isAfterToday, todayIso } from '@/lib/date'
import { fromCents, toCents } from '@/lib/money'
import { currentMonth } from '@/lib/month'
import type { ChargeOriginType, ChargeStatus, ResponsePersonChargeItem, ResponsePersonPayment } from '@/types/api'

import { bodyOf, type Reply, type Routes } from './mock-api'

export interface SeedCharge {
  personId: number
  originType: ChargeOriginType
  /** Despesa/recorrência de origem; nas avulsas é gerado. */
  originId?: number
  description: string
  number?: number | null
  count?: number | null
  date: string
  amount: number
  /** Conta fixa sem fim (resumo mostra só até o mês atual). */
  openEnded?: boolean
}

export interface SeedPayment {
  personId: number
  amount: number
  paidOn: string
  notes?: string | null
  chargeKeys?: string[]
}

interface StoredCharge extends Required<Omit<SeedCharge, 'number' | 'count' | 'openEnded'>> {
  key: string
  id: number
  number: number | null
  count: number | null
  openEnded: boolean
}

interface StoredPayment extends ResponsePersonPayment {
  personId: number
}

const monthOf = (iso: string) => iso.slice(0, 7)

/**
 * Pessoas, cobranças e pagamentos em memória (research.md §9) com o abatimento simplificado da
 * feature 004: pagamentos em ordem de data quitam primeiro as cobranças escolhidas, depois as mais
 * antigas em aberto; a sobra vira crédito. A tela só exibe o que esta "API" devolve.
 */
export function peopleStore({
  people: seedPeople = [],
  charges: seedCharges = [],
  payments: seedPayments = [],
}: {
  people?: string[]
  charges?: SeedCharge[]
  payments?: SeedPayment[]
}) {
  let nextPersonId = 1
  let nextChargeId = 1
  let nextPaymentId = 1
  const people = seedPeople.map((name) => ({ id: nextPersonId++, name }))
  const charges: StoredCharge[] = []
  const payments: StoredPayment[] = []

  const addCharge = (seed: SeedCharge) => {
    const id = nextChargeId++
    const originId = seed.originType === 'Manual' ? id : (seed.originId ?? id)
    const charge: StoredCharge = {
      id,
      key: `${seed.originType}-${originId}-${seed.number ?? id}-${seed.date}`,
      personId: seed.personId,
      originType: seed.originType,
      originId,
      description: seed.description,
      number: seed.number ?? null,
      count: seed.count ?? null,
      date: seed.date,
      amount: seed.amount,
      openEnded: !!seed.openEnded,
    }
    charges.push(charge)
    return charge
  }
  const addPayment = (seed: SeedPayment) => {
    const payment: StoredPayment = {
      id: nextPaymentId++,
      personId: seed.personId,
      amount: seed.amount,
      paidOn: seed.paidOn,
      notes: seed.notes ?? null,
      chargeKeys: seed.chargeKeys ?? [],
    }
    payments.push(payment)
    return payment
  }
  seedCharges.forEach(addCharge)
  seedPayments.forEach(addPayment)

  const chargesOf = (personId: number) => charges.filter((c) => c.personId === personId).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
  const paymentsOf = (personId: number) => payments.filter((p) => p.personId === personId).sort((a, b) => a.paidOn.localeCompare(b.paidOn) || a.id - b.id)

  /** Abatimento: quanto de cada cobrança foi pago e quanto sobrou de crédito. */
  const allocate = (personId: number) => {
    const list = chargesOf(personId)
    const paid = new Map(list.map((c) => [c.key, 0]))
    let credit = 0
    for (const payment of paymentsOf(personId)) {
      let rest = toCents(payment.amount)
      const apply = (charge: StoredCharge) => {
        const open = toCents(charge.amount) - paid.get(charge.key)!
        const value = Math.min(open, rest)
        if (value > 0) {
          paid.set(charge.key, paid.get(charge.key)! + value)
          rest -= value
        }
      }
      list.filter((c) => payment.chargeKeys.includes(c.key)).forEach(apply)
      list.forEach(apply)
      credit += rest
    }
    return { paid, credit }
  }

  const item = (charge: StoredCharge, paidCents: number): ResponsePersonChargeItem => {
    const total = toCents(charge.amount)
    const status: ChargeStatus = paidCents >= total ? 'Paid' : paidCents > 0 ? 'Partial' : 'Open'
    return {
      key: charge.key,
      originType: charge.originType,
      originId: charge.originId,
      description: charge.description,
      number: charge.number,
      count: charge.count,
      date: charge.date,
      amount: charge.amount,
      paid: fromCents(paidCents),
      remaining: fromCents(total - paidCents),
      status,
    }
  }

  const sumCents = (values: number[]) => values.reduce((total, value) => total + toCents(value), 0)

  const balanceUntil = (personId: number, monthExclusive: string) =>
    sumCents(chargesOf(personId).filter((c) => monthOf(c.date) < monthExclusive).map((c) => c.amount)) -
    sumCents(paymentsOf(personId).filter((p) => monthOf(p.paidOn) < monthExclusive).map((p) => p.amount))

  const statement = (personId: number, month: string) => {
    const { paid } = allocate(personId)
    const previous = balanceUntil(personId, month)
    const monthCharges = chargesOf(personId).filter((c) => monthOf(c.date) === month)
    const monthPayments = paymentsOf(personId).filter((p) => monthOf(p.paidOn) === month)
    const totalCharges = sumCents(monthCharges.map((c) => c.amount))
    const totalPaid = sumCents(monthPayments.map((p) => p.amount))
    const [year, m] = month.split('-').map(Number)
    return {
      person: people.find((p) => p.id === personId)!,
      year,
      month: m,
      previousBalance: fromCents(previous),
      charges: monthCharges.map((c) => item(c, paid.get(c.key)!)),
      totalCharges: fromCents(totalCharges),
      totalDue: fromCents(previous + totalCharges),
      payments: monthPayments.map((payment) => {
        const copy: Partial<StoredPayment> = { ...payment }
        delete copy.personId
        return copy as ResponsePersonPayment
      }),
      totalPaid: fromCents(totalPaid),
      endBalance: fromCents(previous + totalCharges - totalPaid),
    }
  }

  const nextMonth = () => {
    const [y, m] = currentMonth().split('-').map(Number)
    return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
  }
  const owedUntilNow = (personId: number) => balanceUntil(personId, nextMonth())

  const summary = (personId: number) => {
    const { paid, credit } = allocate(personId)
    const groups = new Map<string, StoredCharge[]>()
    for (const charge of chargesOf(personId)) {
      const key = `${charge.originType}-${charge.originId}`
      groups.set(key, [...(groups.get(key) ?? []), charge])
    }
    const now = currentMonth()
    const origins = [...groups.values()].map((group) => {
      const first = group[0]
      const counted = first.openEnded ? group.filter((c) => monthOf(c.date) <= now) : group
      const total = sumCents(counted.map((c) => c.amount))
      const paidCents = counted.reduce((sum, c) => sum + paid.get(c.key)!, 0)
      return {
        originType: first.originType,
        originId: first.originId,
        description: first.description,
        chargesDue: group.filter((c) => monthOf(c.date) <= now).length,
        chargesTotal: first.openEnded ? counted.length : group.length,
        monthlyAmount: first.openEnded ? first.amount : null,
        total: fromCents(total),
        paid: fromCents(paidCents),
        remaining: fromCents(total - paidCents),
        isOpenEnded: first.openEnded,
      }
    })
    const allCharges = sumCents(chargesOf(personId).filter((c) => !c.openEnded || monthOf(c.date) <= now).map((c) => c.amount))
    const allPayments = sumCents(paymentsOf(personId).map((p) => p.amount))
    return {
      person: people.find((p) => p.id === personId)!,
      origins,
      owedUntilNow: fromCents(owedUntilNow(personId)),
      owedTotal: fromCents(allCharges - allPayments),
      unallocatedCredit: fromCents(credit),
    }
  }

  const ok = (body: unknown, status = 200): Reply => ({ status, body })
  const fail = (status: number, ...errors: string[]): Reply => ({ status, body: { errors } })
  const validateName = (name: unknown, ignoreId?: number): Reply | null => {
    const text = String(name ?? '').trim()
    if (!text) return fail(400, 'O nome é obrigatório.')
    if (text.length > 100) return fail(400, 'O nome deve ter no máximo 100 caracteres.')
    if (people.some((p) => p.id !== ignoreId && p.name.toLowerCase() === text.toLowerCase())) return fail(409, 'Já existe uma pessoa com esse nome.')
    return null
  }

  const dispatch = (init: RequestInit, key: string): Reply | undefined => {
    const [method, rawPath] = key.split(' ')
    const [path, search = ''] = rawPath.split('?')
    const params = new URLSearchParams(search)
    const body = bodyOf(init) ?? {}

    if (path === '/people') {
      if (method === 'GET') {
        return ok({
          people: people.map((p) => ({
            id: p.id,
            name: p.name,
            balanceUntilNow: fromCents(owedUntilNow(p.id)),
            currentMonthDue: fromCents(owedUntilNow(p.id)),
          })),
        })
      }
      if (method === 'POST') {
        const invalid = validateName(body.name)
        if (invalid) return invalid
        const person = { id: nextPersonId++, name: String(body.name).trim() }
        people.push(person)
        return ok({ ...person, balanceUntilNow: 0, currentMonthDue: 0 }, 201)
      }
    }

    const match = path.match(/^\/people\/(\d+)(\/(statement|summary|charges|payments)(\/(\d+))?)?$/)
    if (!match) return undefined
    const person = people.find((p) => p.id === Number(match[1]))
    if (!person) return fail(404, 'Pessoa não encontrada.')
    const section = match[3]
    const entryId = match[5] ? Number(match[5]) : null

    if (!section) {
      if (method === 'PUT') {
        const invalid = validateName(body.name, person.id)
        if (invalid) return invalid
        person.name = String(body.name).trim()
        return { status: 204 }
      }
      if (method === 'DELETE') {
        if (chargesOf(person.id).length || paymentsOf(person.id).length) {
          return fail(409, 'A pessoa possui lançamentos e não pode ser removida.')
        }
        people.splice(people.indexOf(person), 1)
        return { status: 204 }
      }
    }
    if (section === 'statement' && method === 'GET') {
      const month = `${params.get('year')}-${String(params.get('month')).padStart(2, '0')}`
      return ok(statement(person.id, month))
    }
    if (section === 'summary' && method === 'GET') return ok(summary(person.id))

    if (section === 'charges') {
      const validate = () => {
        const errors: string[] = []
        if (!String(body.description ?? '').trim()) errors.push('A descrição é obrigatória.')
        if (!(Number(body.amount) > 0)) errors.push('O valor deve ser maior que zero.')
        return errors
      }
      if (method === 'POST') {
        const errors = validate()
        if (errors.length) return fail(400, ...errors)
        const charge = addCharge({ personId: person.id, originType: 'Manual', description: body.description, date: body.chargeDate, amount: body.amount })
        return ok({ id: charge.id, key: charge.key, description: charge.description, amount: charge.amount, chargeDate: charge.date, notes: null }, 201)
      }
      const charge = charges.find((c) => c.originType === 'Manual' && c.id === entryId && c.personId === person.id)
      if (!charge) return fail(404, 'Cobrança não encontrada.')
      if (method === 'PUT') {
        const errors = validate()
        if (errors.length) return fail(400, ...errors)
        Object.assign(charge, { description: body.description, amount: body.amount, date: body.chargeDate })
        return ok({ id: charge.id, key: charge.key, description: charge.description, amount: charge.amount, chargeDate: charge.date, notes: null })
      }
      if (method === 'DELETE') {
        charges.splice(charges.indexOf(charge), 1)
        return { status: 204 }
      }
    }

    if (section === 'payments') {
      const validate = () => {
        const errors: string[] = []
        if (!(Number(body.amount) > 0)) errors.push('O valor deve ser maior que zero.')
        if (!body.paidOn) errors.push('A data do pagamento é obrigatória.')
        else if (isAfterToday(body.paidOn)) errors.push('A data do pagamento não pode ser futura.')
        return errors
      }
      if (method === 'POST') {
        const errors = validate()
        if (errors.length) return fail(400, ...errors)
        const payment = addPayment({ personId: person.id, amount: body.amount, paidOn: body.paidOn ?? todayIso(), notes: body.notes, chargeKeys: body.chargeKeys })
        return ok({ id: payment.id, amount: payment.amount, paidOn: payment.paidOn, notes: payment.notes, chargeKeys: payment.chargeKeys }, 201)
      }
      const payment = payments.find((p) => p.id === entryId && p.personId === person.id)
      if (!payment) return fail(404, 'Pagamento não encontrado.')
      if (method === 'PUT') {
        const errors = validate()
        if (errors.length) return fail(400, ...errors)
        Object.assign(payment, { amount: body.amount, paidOn: body.paidOn, notes: body.notes ?? null, chargeKeys: body.chargeKeys ?? [] })
        return ok({ id: payment.id, amount: payment.amount, paidOn: payment.paidOn, notes: payment.notes, chargeKeys: payment.chargeKeys })
      }
      if (method === 'DELETE') {
        payments.splice(payments.indexOf(payment), 1)
        return { status: 204 }
      }
    }
    return undefined
  }

  const routes: Routes = { '*': dispatch }
  return { people, charges, payments, routes }
}
