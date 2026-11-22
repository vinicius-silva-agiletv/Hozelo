import { describe, expect, it } from 'vitest'

import { emptyExpenseForm, expenseSchema, formToRequest, type ExpenseForm } from './schemas'

const valid = (changes: Partial<ExpenseForm> = {}): ExpenseForm => ({
  ...emptyExpenseForm('2026-11-10'),
  name: 'Geladeira',
  categoryId: 1,
  amount: 3500,
  ...changes,
})

const messages = (form: ExpenseForm) => expenseSchema.safeParse(form).error?.issues.map((issue) => issue.message) ?? []

describe('expenseSchema (data-model.md ExpenseForm)', () => {
  it('aceita uma despesa válida', () => {
    expect(expenseSchema.safeParse(valid()).success).toBe(true)
  })

  it('nome, categoria, valor e vencimento obrigatórios', () => {
    expect(messages(valid({ name: ' ', categoryId: null, amount: 0, firstDueDate: '' }))).toEqual([
      'Informe o nome da despesa.',
      'Escolha a categoria.',
      'Informe um valor maior que zero.',
      'Informe o primeiro vencimento.',
    ])
    expect(messages(valid({ name: 'a'.repeat(101) }))).toEqual(['O nome deve ter no máximo 100 caracteres.'])
    expect(messages(valid({ notes: 'a'.repeat(501) }))).toEqual(['A observação deve ter no máximo 500 caracteres.'])
  })

  it('parcelado exige de 2 a 480 parcelas; à vista ignora o campo', () => {
    expect(messages(valid({ isInstallment: true, installmentsCount: 1 }))).toEqual(['Informe de 2 a 480 parcelas.'])
    expect(messages(valid({ isInstallment: true, installmentsCount: 481 }))).toEqual(['Informe de 2 a 480 parcelas.'])
    expect(messages(valid({ isInstallment: true, installmentsCount: Number.NaN }))).toEqual(['Informe de 2 a 480 parcelas.'])
    expect(messages(valid({ isInstallment: false, installmentsCount: Number.NaN }))).toEqual([])
  })

  it('parcelas já pagas de 0 até a quantidade', () => {
    expect(messages(valid({ isInstallment: true, installmentsCount: 10, alreadyPaidInstallments: 11 }))).toEqual([
      'Informe de 0 até a quantidade de parcelas.',
    ])
    expect(messages(valid({ alreadyPaidInstallments: 2 }))).toEqual(['Informe de 0 até a quantidade de parcelas.'])
    expect(messages(valid({ alreadyPaidInstallments: 1 }))).toEqual([])
  })

  it('divisão com pessoa exige pessoa e percentual de 1 a 100', () => {
    expect(messages(valid({ splitWithPerson: true }))).toEqual(['Escolha a pessoa.'])
    expect(messages(valid({ splitWithPerson: true, personId: 1, shareMode: 'percent', personPercent: 0 }))).toEqual([
      'Informe um percentual de 1 a 100.',
    ])
    expect(messages(valid({ splitWithPerson: true, personId: 1, shareMode: 'percent', personPercent: 101 }))).toEqual([
      'Informe um percentual de 1 a 100.',
    ])
  })

  it('converte para o envio', () => {
    expect(formToRequest(valid({ name: ' Geladeira ', notes: '  ' }))).toEqual({
      name: 'Geladeira',
      categoryId: 1,
      amountType: 'Total',
      amount: 3500,
      isInstallment: false,
      installmentsCount: 1,
      firstDueDate: '2026-11-10',
      alreadyPaidInstallments: 0,
      notes: null,
      personId: null,
      personPercent: null,
    })
    expect(formToRequest(valid({ isInstallment: true, installmentsCount: 10 })).installmentsCount).toBe(10)
    expect(formToRequest(valid({ splitWithPerson: true, personId: 3, shareMode: 'full', personPercent: 40 }))).toMatchObject({
      personId: 3,
      personPercent: 100,
    })
    expect(formToRequest(valid({ splitWithPerson: false, personId: 3 }))).toMatchObject({ personId: null, personPercent: null })
  })
})
