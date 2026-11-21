import { describe, expect, it } from 'vitest'

import { addMonths, currentMonth, formatMonth, isWithinRange } from '@/lib/month'

describe('month', () => {
  it('soma e subtrai meses virando o ano', () => {
    expect(addMonths('2026-11', 1)).toBe('2026-12')
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-11', -23)).toBe('2024-12')
  })

  it('formata por extenso em português', () => {
    expect(formatMonth('2026-11')).toBe('novembro de 2026')
    expect(formatMonth('2027-01')).toBe('janeiro de 2027')
  })

  it('mês atual e limites', () => {
    expect(currentMonth(new Date(2026, 10, 21))).toBe('2026-11')
    expect(isWithinRange('2000-01')).toBe(true)
    expect(isWithinRange('1999-12')).toBe(false)
    expect(isWithinRange('2101-01')).toBe(false)
  })
})
