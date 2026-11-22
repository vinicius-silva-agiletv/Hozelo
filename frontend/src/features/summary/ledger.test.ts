import { describe, expect, it } from 'vitest'

import { formatCurrency } from '@/lib/format'

import { heroOf, ledgerLabel, ledgerLink, ledgerShownAmount } from './ledger'

describe('derivações do resumo (data-model.md)', () => {
  it('link do detalhe por tipo', () => {
    expect(ledgerLink({ source: 'Installment', sourceId: 3, direction: 'Expense', month: '2026-11' })).toBe('/despesas?despesa=3')
    expect(ledgerLink({ source: 'Income', sourceId: 4, direction: 'Income', month: '2026-11' })).toBe('/receitas?receita=4')
    expect(ledgerLink({ source: 'Recurrence', sourceId: 5, direction: 'Income', month: '2026-11' })).toBe('/receitas?recorrencia=5')
    expect(ledgerLink({ source: 'Recurrence', sourceId: 6, direction: 'Expense', month: '2026-11' })).toBe('/contas-fixas?recorrencia=6')
    expect(ledgerLink({ source: 'Reimbursement', sourceId: 2, direction: 'Income', month: '2026-10' })).toBe('/pessoas/2?mes=2026-10')
  })

  it('rótulo com parcela e valor exibido', () => {
    expect(ledgerLabel({ name: 'Geladeira', number: 3, installmentsCount: 10 })).toBe('Geladeira · 3/10')
    expect(ledgerLabel({ name: 'Luz', number: null, installmentsCount: null })).toBe('Luz')
    expect(ledgerShownAmount({ amount: 100, isSettled: false, settledAmount: null })).toEqual({ value: formatCurrency(100), of: null })
    expect(ledgerShownAmount({ amount: 1000, isSettled: true, settledAmount: 900 })).toEqual({ value: formatCurrency(900), of: `de ${formatCurrency(1000)}` })
    expect(ledgerShownAmount({ amount: 100, isSettled: true, settledAmount: 100 })).toEqual({ value: formatCurrency(100), of: null })
  })

  it('destaque com acumulado: projeção ou realizado', () => {
    const summary = { accumulated: { previousBalance: 1000, endBalance: 3380 }, forecast: { incomes: 0, expenses: 0, balance: 2380 }, openingBalanceMissing: false }
    expect(heroOf(summary, '2026-11', null, '2026-11')).toEqual({
      kind: 'accumulated',
      value: 3380,
      previous: 1000,
      previousMonth: '2026-10',
      monthBalance: 2380,
      pendingNet: null,
      projection: true,
    })
    expect(heroOf({ ...summary, pending: { toReceive: 500, toPay: 120, items: [] } }, '2026-11', null, '2026-11')).toMatchObject({ pendingNet: 380 })
    expect(heroOf(summary, '2026-10', null, '2026-11')).toMatchObject({ projection: false })
  })

  it('destaque sem acumulado: saldo previsto com o motivo', () => {
    const base = { accumulated: null, forecast: { incomes: 0, expenses: 0, balance: -50 } }
    expect(heroOf({ ...base, openingBalanceMissing: true }, '2026-11', null)).toEqual({ kind: 'forecast', value: -50, reason: 'missing' })
    expect(heroOf({ ...base, openingBalanceMissing: false }, '2026-11', 4)).toMatchObject({ reason: 'filtered' })
    expect(heroOf({ ...base, openingBalanceMissing: false }, '2026-09', null)).toMatchObject({ reason: 'beforeStart' })
  })
})
