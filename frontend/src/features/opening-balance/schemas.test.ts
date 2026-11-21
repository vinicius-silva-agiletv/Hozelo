import { describe, expect, it } from 'vitest'

import { firstDayOfCurrentMonth, openingBalanceSchema, toForm, toRequest } from './schemas'

describe('saldo inicial - formulário', () => {
  it('data padrão é o dia 1º do mês atual', () => {
    expect(firstDayOfCurrentMonth(new Date(2026, 10, 21))).toBe('2026-11-01')
    expect(toForm(null, new Date(2026, 0, 31))).toEqual({ amount: 0, negative: false, referenceDate: '2026-01-01' })
  })

  it('ao alterar, separa valor e sinal', () => {
    expect(toForm({ amount: -450, referenceDate: '2026-10-01' })).toEqual({ amount: 450, negative: true, referenceDate: '2026-10-01' })
    expect(toForm({ amount: 3200, referenceDate: '2026-11-01' })).toEqual({ amount: 3200, negative: false, referenceDate: '2026-11-01' })
  })

  it('envia negativo quando "Saldo negativo" está ligado', () => {
    expect(toRequest({ amount: 450, negative: true, referenceDate: '2026-11-01' })).toEqual({ amount: -450, referenceDate: '2026-11-01' })
    expect(toRequest({ amount: 0, negative: true, referenceDate: '2026-11-01' })).toEqual({ amount: 0, referenceDate: '2026-11-01' })
    expect(toRequest({ amount: 3200, negative: false, referenceDate: '2026-11-01' })).toEqual({ amount: 3200, referenceDate: '2026-11-01' })
  })

  it('exige a data de referência', () => {
    const result = openingBalanceSchema.safeParse({ amount: 10, negative: false, referenceDate: '' })
    expect(result.error?.issues[0].message).toBe('Informe a data de referência.')
    expect(openingBalanceSchema.safeParse({ amount: -1, negative: false, referenceDate: '2026-11-01' }).success).toBe(false)
  })
})
