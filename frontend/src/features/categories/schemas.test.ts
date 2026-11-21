import { describe, expect, it } from 'vitest'

import { categorySchema } from './schemas'

describe('categorySchema', () => {
  it('exige nome e remove espaços das pontas', () => {
    expect(categorySchema.safeParse({ name: '', type: 'Expense' }).error?.issues[0].message).toBe('Informe o nome da categoria.')
    expect(categorySchema.safeParse({ name: '   ', type: 'Expense' }).success).toBe(false)
    expect(categorySchema.parse({ name: '  Luz ', type: 'Income' })).toEqual({ name: 'Luz', type: 'Income' })
  })

  it('aceita até 50 caracteres', () => {
    expect(categorySchema.safeParse({ name: 'a'.repeat(50), type: 'Expense' }).success).toBe(true)
    expect(categorySchema.safeParse({ name: 'a'.repeat(51), type: 'Expense' }).error?.issues[0].message).toBe(
      'O nome deve ter no máximo 50 caracteres.',
    )
  })

  it('aceita só os tipos da API', () => {
    expect(categorySchema.safeParse({ name: 'Luz', type: 'Other' }).success).toBe(false)
  })
})
