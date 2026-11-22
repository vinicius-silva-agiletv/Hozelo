import { describe, expect, it } from 'vitest'

import type { ResponseLedgerItem, ResponseRecurrence } from '@/types/api'

import { fixedBillTotals, isActiveIn, normalAmount, occurrenceOf } from './occurrence'

const light: ResponseRecurrence = {
  id: 1,
  kind: 'Expense',
  name: 'Luz',
  category: { id: 1, name: 'Luz' },
  dayOfMonth: 15,
  startMonth: '2026-01',
  endMonth: null,
  isActive: true,
  currentAmount: 250,
  notes: null,
  person: null,
  personPercent: null,
  amounts: [
    { fromMonth: '2026-01', amount: 200 },
    { fromMonth: '2026-06', amount: 250 },
  ],
  months: [
    { month: '2026-11', amount: 310, skipped: false, settledOn: null },
    { month: '2026-12', amount: null, skipped: true, settledOn: null },
  ],
}

const item = (changes: Partial<ResponseLedgerItem> = {}): ResponseLedgerItem => ({
  source: 'Recurrence',
  sourceId: 1,
  direction: 'Expense',
  number: null,
  installmentsCount: null,
  name: 'Luz',
  category: { id: 1, name: 'Luz' },
  month: '2026-11',
  date: '2026-11-15',
  amount: 310,
  isSettled: false,
  settledAmount: null,
  settledOn: null,
  paidInAdvance: false,
  ...changes,
})

describe('occurrence (data-model.md "Derivações da tela")', () => {
  it('ativa no mês entre início e fim', () => {
    expect(isActiveIn({ startMonth: '2026-03', endMonth: null }, '2026-02')).toBe(false)
    expect(isActiveIn({ startMonth: '2026-03', endMonth: '2026-10' }, '2026-10')).toBe(true)
    expect(isActiveIn({ startMonth: '2026-03', endMonth: '2026-10' }, '2026-11')).toBe(false)
  })

  it('valor normal pelo histórico', () => {
    expect(normalAmount(light, '2026-03')).toBe(200)
    expect(normalAmount(light, '2026-06')).toBe(250)
    expect(normalAmount(light, '2027-01')).toBe(250)
  })

  it('ajustada, pulada, quitada e aberta', () => {
    expect(occurrenceOf(light, item(), '2026-11')).toMatchObject({ status: 'open', amount: 310, normal: 250, adjusted: true })
    expect(occurrenceOf(light, undefined, '2026-12')).toMatchObject({ status: 'skipped', amount: 250 })
    expect(
      occurrenceOf(light, item({ month: '2027-01', amount: 250, isSettled: true, settledAmount: 250, settledOn: '2027-01-15' }), '2027-01'),
    ).toMatchObject({ status: 'settled', amount: 250, adjusted: false, settledOn: '2027-01-15' })
  })

  it('totais sem as puladas', () => {
    const occurrences = [
      occurrenceOf(light, item(), '2026-11')!,
      occurrenceOf(light, undefined, '2026-12')!,
      occurrenceOf(light, item({ amount: 120, isSettled: true, settledAmount: 120 }), '2026-11')!,
    ]
    expect(fixedBillTotals(occurrences)).toEqual({ forecast: 430, paid: 120, open: 310 })
  })
})
