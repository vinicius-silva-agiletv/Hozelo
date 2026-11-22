import { describe, expect, it } from 'vitest'

import { chargeSchema, chargeToRequest, paymentSchema, paymentToRequest, personSchema } from './schemas'

const messages = (result: { error?: { issues: { message: string }[] } }) => result.error?.issues.map((issue) => issue.message) ?? []

describe('schemas de Pessoas (data-model.md)', () => {
  it('PersonForm.name', () => {
    expect(messages(personSchema.safeParse({ name: ' ' }))).toEqual(['Informe o nome.'])
    expect(messages(personSchema.safeParse({ name: 'a'.repeat(101) }))).toEqual(['O nome deve ter no máximo 100 caracteres.'])
    expect(personSchema.parse({ name: ' Esposa ' })).toEqual({ name: 'Esposa' })
  })

  it('PaymentForm: valor, data e observação', () => {
    const valid = { amount: 250, paidOn: '2026-11-15', notes: '', chargeKeys: [] }
    expect(paymentSchema.safeParse(valid).success).toBe(true)
    expect(messages(paymentSchema.safeParse({ ...valid, amount: 0, paidOn: '' }))).toEqual([
      'Informe um valor maior que zero.',
      'Informe a data do pagamento.',
    ])
    expect(messages(paymentSchema.safeParse({ ...valid, paidOn: '2999-01-01' }))).toEqual(['A data não pode ser futura.'])
    expect(messages(paymentSchema.safeParse({ ...valid, notes: 'a'.repeat(501) }))).toEqual(['A observação deve ter no máximo 500 caracteres.'])
  })

  it('pagamento envia cobranças só quando escolhidas', () => {
    expect(paymentToRequest({ amount: 250, paidOn: '2026-11-15', notes: ' ', chargeKeys: [] })).toEqual({ amount: 250, paidOn: '2026-11-15', notes: null })
    expect(paymentToRequest({ amount: 250, paidOn: '2026-11-15', notes: 'pix', chargeKeys: ['k1'] })).toEqual({
      amount: 250,
      paidOn: '2026-11-15',
      notes: 'pix',
      chargeKeys: ['k1'],
    })
  })

  it('ChargeForm: descrição, valor e data (sem observação)', () => {
    expect(messages(chargeSchema.safeParse({ description: '', amount: 0, chargeDate: '' }))).toEqual([
      'Informe a descrição.',
      'Informe um valor maior que zero.',
      'Informe a data.',
    ])
    expect(chargeToRequest({ description: ' Usou o cartão ', amount: 180, chargeDate: '2026-11-10' })).toEqual({
      description: 'Usou o cartão',
      amount: 180,
      chargeDate: '2026-11-10',
      notes: null,
    })
  })
})
