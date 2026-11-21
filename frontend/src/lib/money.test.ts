import { describe, expect, it } from 'vitest'

import { centsFromDigits, parseAmountToCents } from '@/lib/money'

describe('money', () => {
  it('dígitos do texto viram centavos', () => {
    expect(centsFromDigits('R$ 0,00')).toBe(0)
    expect(centsFromDigits('R$ 1.250,501')).toBe(1250501)
    expect(centsFromDigits('R$ 1.250,5')).toBe(12505)
    expect(centsFromDigits('abc')).toBe(0)
  })

  it('converte valores colados', () => {
    expect(parseAmountToCents('1.250,50')).toBe(125050)
    expect(parseAmountToCents('R$ 1.250,5')).toBe(125050)
    expect(parseAmountToCents('1250.5')).toBe(125050)
    expect(parseAmountToCents('1.250')).toBe(125000)
    expect(parseAmountToCents('1250')).toBe(125000)
    expect(parseAmountToCents('abc')).toBeNull()
  })
})
