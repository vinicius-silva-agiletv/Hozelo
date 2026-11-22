import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { addMonthsToDate, todayIso } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import { currentMonth, formatMonth } from '@/lib/month'
import { renderExpenses, TRANSPORTE } from '@/test/expenses-setup'
import { bodyOf } from '@/test/mock-api'

const month = currentMonth()
const money = (value: number) => formatCurrency(value).replace(/\s/g, ' ')
const car = {
  name: 'Carro',
  categoryId: TRANSPORTE,
  amount: 1000,
  amountType: 'Installment' as const,
  installmentsCount: 48,
  firstDueDate: addMonthsToDate(`${month}-28`, -16),
  alreadyPaidInstallments: 16,
}

async function openAmortize(path = '/despesas?despesa=1') {
  const api = await renderExpenses(path, { expenses: [car] })
  const detail = await screen.findByRole('dialog', { name: 'Carro' })
  await userEvent.click(await within(detail).findByRole('button', { name: 'Amortizar' }))
  return { ...api, detail, dialog: await screen.findByRole('dialog', { name: 'Amortizar parcelas' }) }
}

describe('Amortizar (US5)', () => {
  it('"as 6 últimas" com desconto: prévia, envio e parcelas amortizadas', async () => {
    const { dialog, calls } = await openAmortize()

    const quantity = within(dialog).getByLabelText('Quantidade (de 32 em aberto)')
    await userEvent.clear(quantity)
    await userEvent.type(quantity, '6')
    const amount = within(dialog).getByRole('textbox', { name: 'Valor pago' })
    expect(amount).toHaveValue(formatCurrency(6000))
    await userEvent.clear(amount)
    await userEvent.type(amount, '540000')
    expect(within(dialog).getByTestId('amortize-summary').textContent!.replace(/\s/g, ' ')).toBe(
      `6 parcelas · ${money(6000)} · desconto de ${money(600)}`,
    )

    await userEvent.click(within(dialog).getByRole('button', { name: 'Amortizar' }))
    expect(await screen.findByText('Amortização registrada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /expenses/1/amortizations')!.init)).toEqual({
      quantity: 6,
      paidOn: todayIso(),
      paidAmount: 5400,
    })

    const detail = screen.getByRole('dialog', { name: 'Carro' })
    await waitFor(() => expect(within(detail).getAllByText('amortizada')).toHaveLength(6))
    expect(within(detail).getByText('22/48 pagas')).toBeInTheDocument()
  })

  it('escolher parcelas envia os números escolhidos', async () => {
    const { dialog, calls } = await openAmortize()

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Escolher' }))
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /Parcela 47 ·/ }))
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /Parcela 48 ·/ }))
    expect(within(dialog).getByTestId('amortize-summary').textContent!.replace(/\s/g, ' ')).toBe(
      `2 parcelas · ${money(2000)} · desconto de ${money(0)}`,
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Amortizar' }))

    expect(await screen.findByText('Amortização registrada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /expenses/1/amortizations')!.init)).toMatchObject({
      installmentNumbers: [47, 48],
      paidAmount: 2000,
    })
  })

  it('valida valor acima da soma, data futura e nenhuma parcela', async () => {
    const { dialog, calls } = await openAmortize()

    const amount = within(dialog).getByRole('textbox', { name: 'Valor pago' })
    await userEvent.clear(amount)
    await userEvent.type(amount, '150000')
    fireEvent.change(within(dialog).getByLabelText('Data do pagamento'), { target: { value: addMonthsToDate(todayIso(), 1) } })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Amortizar' }))

    expect(await within(dialog).findByText(/^O valor pago deve ser maior que zero e no máximo R\$\s1\.000,00\.$/)).toBeInTheDocument()
    expect(within(dialog).getByText('A data não pode ser futura.')).toBeInTheDocument()

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Escolher' }))
    expect(within(dialog).getByText('Escolha ao menos uma parcela.')).toBeInTheDocument()
    expect(calls.some((call) => call.key.endsWith('/amortizations'))).toBe(false)
  })

  it('parcelas amortizadas aparecem como antecipadas no mês do pagamento', async () => {
    const { dialog } = await openAmortize()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Amortizar' }))
    await screen.findByText('Amortização registrada.')

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const list = await screen.findByRole('list', { name: `Parcelas de ${formatMonth(month)}` })
    await waitFor(() => expect(within(list).getByText('48/48').closest('li')).toHaveTextContent('antecipada'))
  })
})
