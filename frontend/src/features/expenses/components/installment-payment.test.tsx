import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { addMonthsToDate, todayIso } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import { currentMonth } from '@/lib/month'
import { CASA, renderExpenses } from '@/test/expenses-setup'
import { bodyOf } from '@/test/mock-api'

const month = currentMonth()
const fridge = { name: 'Geladeira', categoryId: CASA, amount: 3500, installmentsCount: 10, firstDueDate: `${month}-10` }
const LABEL = 'Geladeira, parcela 1 de 10'
const money = (value: number) => formatCurrency(value).replace(/\s/g, ' ')
const totals = () => screen.getByLabelText('Totais do mês').textContent!.replace(/\s/g, ' ')

describe('Marcar parcela como paga ou desfazer (US2)', () => {
  it('marca e desmarca em um toque, com totais vindos da API', async () => {
    const { calls } = await renderExpenses('/despesas', { expenses: [fridge] })

    await userEvent.click(await screen.findByRole('checkbox', { name: `Em aberto: ${LABEL}` }))
    expect(await screen.findByText('Parcela marcada como paga.')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: `Paga: ${LABEL}` })).toBeChecked()
    await waitFor(() => expect(totals()).toContain(`Pago${money(350)}`))
    expect(totals()).toContain(`Em aberto${money(0)}`)
    expect(calls.filter((call) => call.key === 'POST /expenses/1/installments/1/payment')).toHaveLength(1)

    await userEvent.click(screen.getByRole('checkbox', { name: `Paga: ${LABEL}` }))
    expect(await screen.findByText('Pagamento desfeito.')).toBeInTheDocument()
    await waitFor(() => expect(totals()).toContain(`Em aberto${money(350)}`))
  })

  it('toque duplo envia uma vez só', async () => {
    const { calls } = await renderExpenses('/despesas', { expenses: [fridge] })

    await userEvent.dblClick(await screen.findByRole('checkbox', { name: `Em aberto: ${LABEL}` }))
    await screen.findByText('Parcela marcada como paga.')
    expect(calls.filter((call) => call.key.includes('/payment'))).toHaveLength(1)
    expect(screen.getByRole('checkbox', { name: `Paga: ${LABEL}` })).toBeChecked()
  })

  it('"Pagar em outra data" recusa data futura e envia a escolhida', async () => {
    const { calls } = await renderExpenses('/despesas', { expenses: [fridge] })

    await userEvent.click(await screen.findByRole('button', { name: `Ações de ${LABEL}` }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Pagar em outra data' }))
    const dialog = await screen.findByRole('dialog', { name: 'Pagar em outra data' })

    const date = within(dialog).getByLabelText('Data do pagamento')
    expect(date).toHaveValue(todayIso())
    fireEvent.change(date, { target: { value: addMonthsToDate(todayIso(), 1) } })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Marcar como paga' }))
    expect(await within(dialog).findByText('A data não pode ser futura.')).toBeInTheDocument()

    const yesterday = addMonthsToDate(todayIso(), -1)
    fireEvent.change(date, { target: { value: yesterday } })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Marcar como paga' }))
    expect(await screen.findByText('Parcela marcada como paga.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /expenses/1/installments/1/payment')!.init)).toEqual({ paidOn: yesterday })
  })

  it('desfazer parcela amortizada pede confirmação', async () => {
    const { store, calls } = await renderExpenses('/despesas?mes=2030-01', { expenses: [fridge] })
    Object.assign(store.items[0].installments[4], { isPaid: true, paidOn: todayIso(), paidAmount: 300, prepaid: true })

    await userEvent.click(await screen.findByRole('button', { name: 'Mês atual' }))
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Paga: Geladeira, parcela 5 de 10' }))

    const confirm = await screen.findByRole('alertdialog', { name: 'Desfazer pagamento?' })
    expect(within(confirm).getByText(/remove o desconto correspondente/)).toBeInTheDocument()
    expect(calls.some((call) => call.key.startsWith('DELETE'))).toBe(false)

    await userEvent.click(within(confirm).getByRole('button', { name: 'Desfazer pagamento' }))
    expect(await screen.findByText('Pagamento desfeito.')).toBeInTheDocument()
    expect(calls.some((call) => call.key === 'DELETE /expenses/1/installments/5/payment')).toBe(true)
  })

  it('recusa da API volta a parcela ao estado anterior e mostra a mensagem', async () => {
    await renderExpenses('/despesas', {
      expenses: [fridge],
      routes: { 'POST /expenses/1/installments/1/payment': { status: 400, body: { errors: ['Não foi possível pagar.'] } } },
    })

    await userEvent.click(await screen.findByRole('checkbox', { name: `Em aberto: ${LABEL}` }))
    expect(await screen.findByText('Não foi possível pagar.')).toBeInTheDocument()
    expect(await screen.findByRole('checkbox', { name: `Em aberto: ${LABEL}` })).not.toBeChecked()
  })
})
