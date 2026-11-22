import { describe, expect, it } from 'vitest'

import { incomeSchema, incomeToRequest, emptyIncomeForm, type IncomeForm } from '@/features/incomes/schemas'

import { emptyRecurrenceForm, formToCreateRequest, recurrenceSchema, type RecurrenceForm } from './schemas'

const messages = (result: { error?: { issues: { message: string }[] } }) => result.error?.issues.map((issue) => issue.message) ?? []

describe('recurrenceSchema (data-model.md RecurrenceForm)', () => {
  const valid = (changes: Partial<RecurrenceForm> = {}): RecurrenceForm => ({
    ...emptyRecurrenceForm('2026-11', 5),
    name: 'Salário',
    categoryId: 1,
    amount: 6000,
    ...changes,
  })

  it('aceita uma recorrência válida e converte para o envio', () => {
    expect(recurrenceSchema.safeParse(valid()).success).toBe(true)
    expect(formToCreateRequest(valid({ notes: ' ', hasEnd: true, endMonth: '2027-03' }), 'Income')).toEqual({
      kind: 'Income',
      name: 'Salário',
      categoryId: 1,
      amount: 6000,
      dayOfMonth: 5,
      startMonth: '2026-11',
      endMonth: '2027-03',
      notes: null,
      personId: null,
      personPercent: null,
    })
  })

  it('nome, categoria, valor, dia e fim', () => {
    expect(messages(recurrenceSchema.safeParse(valid({ name: '', categoryId: null, amount: 0, dayOfMonth: 32 })))).toEqual([
      'Informe o nome.',
      'Escolha a categoria.',
      'Informe um dia de 1 a 31.',
      'Informe um valor maior que zero.',
    ])
    expect(messages(recurrenceSchema.safeParse(valid({ dayOfMonth: Number.NaN })))).toEqual(['Informe um dia de 1 a 31.'])
    expect(messages(recurrenceSchema.safeParse(valid({ hasEnd: true, endMonth: '2026-10' })))).toEqual(['O fim não pode ser antes do início.'])
  })

  it('na edição não valida valor nem fim; pessoa só vai em despesas', () => {
    expect(recurrenceSchema.safeParse(valid({ editing: true, amount: 0, hasEnd: true, endMonth: '2000-01' })).success).toBe(true)
    const split = valid({ splitWithPerson: true, personId: 2, shareMode: 'percent', personPercent: 50 })
    expect(formToCreateRequest(split, 'Expense')).toMatchObject({ personId: 2, personPercent: 50 })
    expect(formToCreateRequest(split, 'Income')).toMatchObject({ personId: null, personPercent: null })
  })
})

describe('incomeSchema (data-model.md IncomeForm)', () => {
  const valid = (changes: Partial<IncomeForm> = {}): IncomeForm => ({
    ...emptyIncomeForm('2026-11-20', '2026-11-21'),
    name: '13º salário',
    categoryId: 2,
    amount: 3000,
    ...changes,
  })

  it('valida campos e data de recebimento', () => {
    expect(messages(incomeSchema.safeParse(valid({ name: ' ', categoryId: null, amount: 0, expectedDate: '' })))).toEqual([
      'Informe o nome da receita.',
      'Escolha a categoria.',
      'Informe um valor maior que zero.',
      'Informe a data prevista.',
    ])
    expect(messages(incomeSchema.safeParse(valid({ alreadyReceived: true, receivedOn: '2999-01-01' })))).toEqual(['A data não pode ser futura.'])
  })

  it('converte para o envio, com recebimento só quando marcado', () => {
    expect(incomeToRequest(valid())).toEqual({ name: '13º salário', categoryId: 2, amount: 3000, expectedDate: '2026-11-20', notes: null })
    expect(incomeToRequest(valid({ alreadyReceived: true }))).toMatchObject({ receivedOn: '2026-11-21' })
  })
})
