import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { formatCurrency } from '@/lib/format'
import { addMonths, currentMonth, formatMonth } from '@/lib/month'
import { bodyOf } from '@/test/mock-api'
import { renderPeople } from '@/test/people-setup'
import { currentLocation } from '@/test/render'

const month = currentMonth()
const money = (value: number) => formatCurrency(value).replace(/\s/g, ' ')
const statementText = async () => (await screen.findByLabelText(`Extrato de ${formatMonth(month)}`)).textContent!.replace(/\s/g, ' ')

describe('Cobranças avulsas (US4)', () => {
  it('lança, edita e remove; sem campo de observação', async () => {
    const { calls } = await renderPeople('/pessoas/1', { people: ['Sogro'] })

    await userEvent.click(await screen.findByRole('button', { name: 'Cobrança avulsa' }))
    const dialog = await screen.findByRole('dialog', { name: 'Cobrança avulsa' })
    expect(within(dialog).queryByLabelText(/Observação/)).not.toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Lançar cobrança' }))
    expect(await within(dialog).findByText('Informe a descrição.')).toBeInTheDocument()
    expect(within(dialog).getByText('Informe um valor maior que zero.')).toBeInTheDocument()

    await userEvent.type(within(dialog).getByLabelText('Descrição'), 'Usou o cartão')
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Valor' }), '18000')
    fireEvent.change(within(dialog).getByLabelText('Data'), { target: { value: `${month}-10` } })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Lançar cobrança' }))
    expect(await screen.findByText('Cobrança lançada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /people/1/charges')!.init)).toEqual({
      description: 'Usou o cartão',
      amount: 180,
      chargeDate: `${month}-10`,
      notes: null,
    })
    await waitFor(async () => expect(await statementText()).toContain('Usou o cartão'))

    await userEvent.click(screen.getByRole('button', { name: 'Ações de Usou o cartão' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Editar' }))
    const edit = await screen.findByRole('dialog', { name: 'Editar cobrança' })
    expect(within(edit).getByLabelText('Descrição')).toHaveValue('Usou o cartão')
    const amount = within(edit).getByRole('textbox', { name: 'Valor' })
    await userEvent.clear(amount)
    await userEvent.type(amount, '20000')
    await userEvent.click(within(edit).getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Cobrança atualizada.')).toBeInTheDocument()
    expect(calls.some((call) => call.key === 'PUT /people/1/charges/1')).toBe(true)
    await waitFor(async () => expect(await statementText()).toContain(`Total devido${money(200)}`))

    await userEvent.click(screen.getByRole('button', { name: 'Ações de Usou o cartão' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remover' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Remover cobrança?' })
    await userEvent.click(within(confirm).getByRole('button', { name: 'Remover' }))
    expect(await screen.findByText('Cobrança removida.')).toBeInTheDocument()
    await waitFor(async () => expect(await statementText()).not.toContain('Usou o cartão'))
  })
})

describe('Resumo geral (US5)', () => {
  it('origens com vencidas, pago, falta, sem fim e totais; tocar abre o detalhe', async () => {
    await renderPeople('/pessoas/1?aba=resumo', {
      people: ['Sogro'],
      charges: [
        ...Array.from({ length: 10 }, (_, index) => ({
          personId: 1,
          originType: 'Expense' as const,
          originId: 3,
          description: 'Geladeira',
          number: index + 1,
          count: 10,
          date: `${addMonths(month, index - 2)}-10`,
          amount: 350,
        })),
        { personId: 1, originType: 'Recurrence' as const, originId: 8, description: 'Internet · 50%', date: `${month}-10`, amount: 60, openEnded: true },
      ],
      payments: [{ personId: 1, amount: 500, paidOn: `${month}-01` }],
    })

    const origins = within(await screen.findByRole('list', { name: 'Origens' })).getAllByRole('listitem')
    const fridge = origins[0].textContent!.replace(/\s/g, ' ')
    expect(fridge).toContain('Geladeira')
    expect(fridge).toContain('despesa · 3 de 10 vencidas')
    expect(fridge).toContain(`Total ${money(3500)}`)
    expect(fridge).toContain(`Pago ${money(500)}`)
    expect(fridge).toContain(`falta ${money(3000)}`)
    expect(origins[1].textContent!.replace(/\s/g, ' ')).toContain(`conta fixa · ${money(60)} por mês · sem fim`)

    const totals = screen.getByLabelText('Totais da pessoa').textContent!.replace(/\s/g, ' ')
    expect(totals).toContain(`Deve até hoje${money(610)}`)
    expect(totals).toContain(`Deve no total${money(3060)}`)

    await userEvent.click(within(origins[1]).getByRole('link', { name: 'Abrir Internet · 50%' }))
    await waitFor(() => expect(currentLocation()).toBe('/contas-fixas?recorrencia=8'))
  })
})

describe('Editar e remover pagamentos (US6)', () => {
  it('edita com as cobranças escolhidas pré-marcadas e remove', async () => {
    const { calls, store } = await renderPeople('/pessoas/1', {
      people: ['Esposa'],
      charges: [{ personId: 1, originType: 'Expense' as const, originId: 7, description: 'Fatura · 50%', date: `${month}-01`, amount: 350 }],
      // Chave da cobrança no formato do peopleStore (origem-id-número-data).
      payments: [{ personId: 1, amount: 100, paidOn: `${month}-05`, notes: 'pix', chargeKeys: [`Expense-7-1-${month}-01`] }],
    })
    const key = store.charges[0].key
    expect(store.payments[0].chargeKeys).toEqual([key])

    await userEvent.click(await screen.findByRole('button', { name: /^Ações de pagamento/ }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Editar' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar pagamento' })
    expect(within(dialog).getByLabelText('Observação (opcional)')).toHaveValue('pix')
    expect(await within(dialog).findByRole('checkbox', { name: /Fatura · 50%/ })).toBeChecked()
    const amount = within(dialog).getByRole('textbox', { name: 'Valor pago' })
    await userEvent.clear(amount)
    await userEvent.type(amount, '15000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Pagamento atualizado.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'PUT /people/1/payments/1')!.init)).toMatchObject({ amount: 150, notes: 'pix', chargeKeys: [key] })
    await waitFor(async () => expect(await statementText()).toContain(`Total pago${money(150)}`))

    await userEvent.click(screen.getByRole('button', { name: /^Ações de pagamento/ }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remover' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Remover pagamento?' })
    await userEvent.click(within(confirm).getByRole('button', { name: 'Remover' }))
    expect(await screen.findByText('Pagamento removido.')).toBeInTheDocument()
    await waitFor(async () => expect(await statementText()).toContain('Nenhum pagamento neste mês.'))
  })
})
