import { describe, expect, it } from 'vitest'

import { formatBalance, formatCurrency, formatDate, pluralize } from './format'

describe('format', () => {
  it('formata moeda e data', () => {
    expect(formatCurrency(1250.5)).toBe('R$ 1.250,50')
    expect(formatDate('2026-11-01')).toBe('01/11/2026')
  })

  it('saldo com crédito', () => {
    expect(formatBalance(1240)).toBe(formatCurrency(1240))
    expect(formatBalance(-50)).toBe(`crédito de ${formatCurrency(50)}`)
    expect(formatBalance(0)).toBe(formatCurrency(0))
  })

  it('pluraliza com texto para zero', () => {
    expect(pluralize(0, 'lançamento', 'lançamentos', 'Nenhum lançamento')).toBe('Nenhum lançamento')
    expect(pluralize(1, 'lançamento', 'lançamentos', 'Nenhum lançamento')).toBe('1 lançamento')
    expect(pluralize(3, 'lançamento', 'lançamentos')).toBe('3 lançamentos')
    expect(pluralize(0, 'categoria', 'categorias')).toBe('0 categorias')
  })
})
