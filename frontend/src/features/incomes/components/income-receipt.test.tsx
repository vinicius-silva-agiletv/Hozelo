import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { addMonthsToDate, todayIso } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import { addMonths, currentMonth, formatMonth } from '@/lib/month'
import { DECIMO, renderFinance, SALARIO } from '@/test/finance-setup'
import { bodyOf } from '@/test/mock-api'

const month = currentMonth()
const money = (value: number) => formatCurrency(value).replace(/\s/g, ' ')
const totals = () => screen.getByLabelText('Totais do mês').textContent!.replace(/\s/g, ' ')
const seed = {
  recurrences: [{ kind: 'Income' as const, name: 'Salário', categoryId: SALARIO, amount: 6000, dayOfMonth: 5, startMonth: month }],
  incomes: [{ name: '13º salário', categoryId: DECIMO, amount: 3000, expectedDate: `${month}-20` }],
}
const [year, m] = month.split('-').map(Number)
const salaryLabel = `Salário, ${formatMonth(month)}`

describe('Receber ou desfazer (US2)', () => {
  it('avulsa: recebe e desfaz com totais da API', async () => {
    const { calls } = await renderFinance('/receitas', seed)

    await userEvent.click(await screen.findByRole('checkbox', { name: 'A receber: 13º salário' }))
    expect(await screen.findByText('Receita marcada como recebida.')).toBeInTheDocument()
    await waitFor(() => expect(totals()).toContain(`Recebido${money(3000)}`))
    expect(calls.some((call) => call.key === 'POST /incomes/1/receipt')).toBe(true)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Recebida: 13º salário' }))
    expect(await screen.findByText('Recebimento desfeito.')).toBeInTheDocument()
    await waitFor(() => expect(totals()).toContain(`Recebido${money(0)}`))
  })

  it('recorrente: quita só o mês', async () => {
    const { store, calls } = await renderFinance('/receitas', seed)

    await userEvent.click(await screen.findByRole('checkbox', { name: `A receber: ${salaryLabel}` }))
    expect(await screen.findByText('Receita marcada como recebida.')).toBeInTheDocument()
    expect(calls.some((call) => call.key === `POST /recurrences/1/months/${year}/${m}/settlement`)).toBe(true)
    expect(store.recurrences[0].months.map((record) => record.month)).toEqual([month])

    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(await screen.findByRole('checkbox', { name: `A receber: Salário, ${formatMonth(addMonths(month, 1))}` })).not.toBeChecked()
  })

  it('"Receber em outra data" recusa data futura', async () => {
    const { calls } = await renderFinance('/receitas', seed)

    await userEvent.click(await screen.findByRole('button', { name: 'Ações de 13º salário' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Receber em outra data' }))
    const dialog = await screen.findByRole('dialog', { name: 'Receber em outra data' })
    const date = within(dialog).getByLabelText('Data do recebimento')
    fireEvent.change(date, { target: { value: addMonthsToDate(todayIso(), 1) } })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Receber' }))
    expect(await within(dialog).findByText('A data não pode ser futura.')).toBeInTheDocument()

    const earlier = addMonthsToDate(todayIso(), -1)
    fireEvent.change(date, { target: { value: earlier } })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Receber' }))
    expect(await screen.findByText('Receita marcada como recebida.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /incomes/1/receipt')!.init)).toEqual({ receivedOn: earlier })
  })

  it('"Receber com outro valor" ajusta o mês e quita', async () => {
    const { store, calls } = await renderFinance('/receitas', seed)

    await userEvent.click(await screen.findByRole('button', { name: 'Ações de Salário' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Receber com outro valor' }))
    const dialog = await screen.findByRole('dialog', { name: 'Receber com outro valor' })
    const amount = within(dialog).getByRole('textbox', { name: 'Valor' })
    expect(amount).toHaveValue(formatCurrency(6000))
    await userEvent.clear(amount)
    await userEvent.type(amount, '620000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Receber' }))

    expect(await screen.findByText('Receita marcada como recebida.')).toBeInTheDocument()
    const keys = calls.map((call) => call.key)
    expect(keys.indexOf(`PUT /recurrences/1/months/${year}/${m}`)).toBeLessThan(keys.indexOf(`POST /recurrences/1/months/${year}/${m}/settlement`))
    expect(store.recurrences[0].months[0]).toMatchObject({ amount: 6200, settledOn: todayIso() })
    await waitFor(() => expect(totals()).toContain(`Recebido${money(6200)}`))
    expect(screen.getByText(/ajustado \(normal R\$\s6\.000,00\)/)).toBeInTheDocument()
  })

  it('toque duplo envia uma vez; recusa da API volta a caixa', async () => {
    const { calls } = await renderFinance('/receitas', {
      ...seed,
      routes: { [`POST /recurrences/1/months/${year}/${m}/settlement`]: { status: 400, body: { errors: ['Não foi possível.'] } } },
    })

    await userEvent.dblClick(await screen.findByRole('checkbox', { name: 'A receber: 13º salário' }))
    await screen.findByText('Receita marcada como recebida.')
    expect(calls.filter((call) => call.key.includes('/receipt'))).toHaveLength(1)

    await userEvent.click(screen.getByRole('checkbox', { name: `A receber: ${salaryLabel}` }))
    expect(await screen.findByText('Não foi possível.')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: `A receber: ${salaryLabel}` })).not.toBeChecked()
  })
})
