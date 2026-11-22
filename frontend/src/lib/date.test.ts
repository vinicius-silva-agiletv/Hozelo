import { describe, expect, it } from 'vitest'

import { addMonthsToDate, isAfterToday, isValidIsoDate, lastDayOfMonth, todayIso } from './date'

describe('date', () => {
  const now = new Date(2026, 10, 21, 23, 30)

  it('hoje e futuro usam a data local', () => {
    expect(todayIso(now)).toBe('2026-11-21')
    expect(isAfterToday('2026-11-21', now)).toBe(false)
    expect(isAfterToday('2026-11-22', now)).toBe(true)
  })

  it('último dia do mês, inclusive ano bissexto', () => {
    expect(lastDayOfMonth(2026, 2)).toBe(28)
    expect(lastDayOfMonth(2028, 2)).toBe(29)
    expect(lastDayOfMonth(2026, 12)).toBe(31)
  })

  it('soma meses limitando ao último dia', () => {
    expect(addMonthsToDate('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonthsToDate('2026-11-10', 9)).toBe('2027-08-10')
    expect(addMonthsToDate('2026-03-15', -3)).toBe('2025-12-15')
  })

  it('valida datas', () => {
    expect(isValidIsoDate('2026-02-29')).toBe(false)
    expect(isValidIsoDate('2026-02-28')).toBe(true)
    expect(isValidIsoDate('')).toBe(false)
  })
})
