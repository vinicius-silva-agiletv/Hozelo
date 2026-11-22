import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { addMonthsToDate, todayIso } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import { currentMonth, formatMonth } from '@/lib/month'
import { bodyOf } from '@/test/mock-api'
import { renderPeople } from '@/test/people-setup'

const month = currentMonth()
const money = (value: number) => formatCurrency(value).replace(/\s/g, ' ')
const seed = {
  people: ['Esposa', 'Sogro'],
  charges: [
    { personId: 1, originType: 'Expense' as const, originId: 7, description: 'Fatura · 50%', date: `${month}-01`, amount: 350 },
    { personId: 1, originType: 'Recurrence' as const, originId: 4, description: 'Internet · 50%', date: `${month}-02`, amount: 60 },
  ],
}

describe('Registrar pagamento (US3)', () => {
  it('pela lista: valor sugerido = devido no mês; registra e atualiza o saldo', async () => {
    const { calls } = await renderPeople('/pessoas', seed)

    await userEvent.click(await screen.findByRole('button', { name: 'Pagamento de Esposa' }))
    const dialog = await screen.findByRole('dialog', { name: 'Pagamento' })
    const amount = within(dialog).getByRole('textbox', { name: 'Valor pago' })
    expect(amount).toHaveValue(formatCurrency(410))
    expect(within(dialog).getByLabelText('Data')).toHaveValue(todayIso())

    await userEvent.clear(amount)
    await userEvent.type(amount, '25000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Registrar pagamento' }))

    expect(await screen.findByText('Pagamento registrado.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /people/1/payments')!.init)).toEqual({ amount: 250, paidOn: todayIso(), notes: null })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Abrir Esposa' }).textContent!.replace(/\s/g, ' ')).toContain(`Deve até agora ${money(160)}`),
    )
  })

  it('sem dívida, o valor vem vazio', async () => {
    await renderPeople('/pessoas', seed)
    await userEvent.click(await screen.findByRole('button', { name: 'Pagamento de Sogro' }))
    const dialog = await screen.findByRole('dialog', { name: 'Pagamento' })
    expect(within(dialog).getByRole('textbox', { name: 'Valor pago' })).toHaveValue(formatCurrency(0))
  })

  it('pelo detalhe, escolhendo a cobrança que quita primeiro', async () => {
    const { calls, store } = await renderPeople('/pessoas/1', seed)

    await userEvent.click(await screen.findByRole('button', { name: 'Pagamento' }))
    const dialog = await screen.findByRole('dialog', { name: 'Pagamento' })
    expect(within(dialog).queryByRole('list', { name: 'Cobranças em aberto' })).not.toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Escolher o que este pagamento quita (opcional)' }))
    await userEvent.click(await within(dialog).findByRole('checkbox', { name: /Internet · 50%/ }))
    const amount = within(dialog).getByRole('textbox', { name: 'Valor pago' })
    await userEvent.clear(amount)
    await userEvent.type(amount, '6000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Registrar pagamento' }))

    expect(await screen.findByText('Pagamento registrado.')).toBeInTheDocument()
    const internet = store.charges.find((c) => c.originId === 4)!
    expect(bodyOf(calls.find((call) => call.key === 'POST /people/1/payments')!.init)).toMatchObject({ amount: 60, chargeKeys: [internet.key] })
    const statement = await screen.findByLabelText(`Extrato de ${formatMonth(month)}`)
    await waitFor(() => expect(within(statement).getAllByText('paga')).toHaveLength(1))
    expect(within(statement).getByText('em aberto')).toBeInTheDocument()
  })

  it('pagamento maior vira crédito; validações e recusa da API', async () => {
    await renderPeople('/pessoas/1', {
      ...seed,
      routes: { 'POST /people/2/payments': { status: 400, body: { errors: ['Não foi possível.'] } } },
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Pagamento' }))
    const dialog = await screen.findByRole('dialog', { name: 'Pagamento' })
    const amount = within(dialog).getByRole('textbox', { name: 'Valor pago' })
    await userEvent.clear(amount)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Registrar pagamento' }))
    expect(await within(dialog).findByText('Informe um valor maior que zero.')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText('Data'), { target: { value: addMonthsToDate(todayIso(), 1) } })
    await userEvent.type(amount, '50000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Registrar pagamento' }))
    expect(await within(dialog).findByText('A data não pode ser futura.')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText('Data'), { target: { value: todayIso() } })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Registrar pagamento' }))
    expect(await screen.findByText('Pagamento registrado.')).toBeInTheDocument()
    const statement = await screen.findByLabelText(`Extrato de ${formatMonth(month)}`)
    await waitFor(() => expect(statement.textContent!.replace(/\s/g, ' ')).toContain(`crédito de ${money(90)}`))
  })
})
