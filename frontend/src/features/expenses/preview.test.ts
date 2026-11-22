import { describe, expect, it } from 'vitest'

import {
  amortizationPreview,
  defaultFirstDueDate,
  expenseSummary,
  installmentDueDate,
  personShare,
  splitInstallments,
  suggestedPaidCount,
  totalFromInstallment,
} from './preview'

describe('prévias da despesa (data-model.md "Prévias")', () => {
  it('divide o total com a sobra na última parcela', () => {
    expect(splitInstallments(10000, 3)).toEqual({ installment: 3333, last: 3334 })
    expect(splitInstallments(350000, 10)).toEqual({ installment: 35000, last: 35000 })
    expect(splitInstallments(5000, 1)).toEqual({ installment: 5000, last: 5000 })
  })

  it('total a partir da parcela', () => {
    expect(totalFromInstallment(100000, 48)).toBe(4800000)
  })

  it('vencimentos mensais no mesmo dia ou no último dia do mês', () => {
    expect(installmentDueDate('2026-01-31', 2)).toBe('2026-02-28')
    expect(installmentDueDate('2026-01-31', 3)).toBe('2026-03-31')
    expect(installmentDueDate('2026-11-10', 10)).toBe('2027-08-10')
  })

  it('sugere as parcelas vencidas antes do mês atual', () => {
    expect(suggestedPaidCount('2023-05-15', 48, '2026-11-21')).toBe(42)
    expect(suggestedPaidCount('2026-11-01', 10, '2026-11-21')).toBe(0)
    expect(suggestedPaidCount('2027-01-10', 10, '2026-11-21')).toBe(0)
    expect(suggestedPaidCount('2020-01-10', 12, '2026-11-21')).toBe(12)
  })

  it('vencimento padrão no mês aberto', () => {
    expect(defaultFirstDueDate('2026-12', '2026-11-21')).toBe('2026-12-21')
    expect(defaultFirstDueDate('2027-02', '2026-11-30')).toBe('2027-02-28')
  })

  it('prévia da amortização e parte da pessoa', () => {
    expect(amortizationPreview(Array(6).fill(100000), 540000)).toEqual({ sum: 600000, discount: 60000 })
    expect(amortizationPreview([100000], 100000)).toEqual({ sum: 100000, discount: 0 })
    expect(personShare(35000, 50)).toBe(17500)
    expect(personShare(3333, 50)).toBe(1667)
  })

  it('resumo do formulário', () => {
    expect(
      expenseSummary({ amountType: 'Total', amountCents: 350000, count: 10, firstDueDate: '2026-11-10', alreadyPaid: 0 }),
    ).toMatchObject({ installment: 35000, last: 35000, hasRemainder: false, total: 350000, lastDueDate: '2027-08-10', remaining: 10 })
    expect(
      expenseSummary({ amountType: 'Installment', amountCents: 100000, count: 48, firstDueDate: '2023-05-15', alreadyPaid: 42 }),
    ).toMatchObject({ total: 4800000, paid: 42, remaining: 6, lastDueDate: '2027-04-15' })
    expect(
      expenseSummary({ amountType: 'Total', amountCents: 10000, count: 3, firstDueDate: '2026-11-10', alreadyPaid: 0 }),
    ).toMatchObject({ installment: 3333, last: 3334, hasRemainder: true })
  })
})
