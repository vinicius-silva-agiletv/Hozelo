import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { addMonthsToDate, todayIso } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import { addMonths, currentMonth, formatMonth } from '@/lib/month'
import { EDUCACAO, INTERNET, LUZ, renderFinance } from '@/test/finance-setup'
import { bodyOf } from '@/test/mock-api'

const month = currentMonth()
const next = addMonths(month, 1)
const [year, m] = month.split('-').map(Number)
const money = (value: number) => formatCurrency(value).replace(/\s/g, ' ')
const totals = () => screen.getByLabelText('Totais do mês').textContent!.replace(/\s/g, ' ')
const rows = () => within(screen.getByRole('list', { name: /^Contas fixas de/ })).getAllByRole('listitem')

const bill = (name: string, categoryId: number, amount: number, dayOfMonth: number, extra = {}) => ({
  kind: 'Expense' as const,
  name,
  categoryId,
  amount,
  dayOfMonth,
  startMonth: addMonths(month, -3),
  ...extra,
})

describe('Contas fixas (US4)', () => {
  it('lista as contas do mês por dia com valor, situação e totais', async () => {
    await renderFinance('/contas-fixas', { recurrences: [bill('Luz', LUZ, 250, 15), bill('Internet', INTERNET, 120, 10)] })

    expect(await screen.findByRole('heading', { level: 1, name: 'Contas fixas' })).toBeInTheDocument()
    expect(document.title).toBe('Contas fixas · Hozelo')
    await screen.findByRole('list', { name: `Contas fixas de ${formatMonth(month)}` })
    expect(rows().map((row) => within(row).getByRole('button', { name: /^Abrir/ }).getAttribute('aria-label'))).toEqual(['Abrir Internet', 'Abrir Luz'])
    expect(rows()[0]).toHaveTextContent('dia 10')
    expect(rows()[0]).toHaveTextContent('Internet')
    expect(totals()).toContain(`Previsto${money(370)}`)
    expect(totals()).toContain(`Pago${money(0)}`)
    expect(totals()).toContain(`A pagar${money(370)}`)
  })

  it('paga só o mês, desfaz e paga em outra data', async () => {
    const { calls, store } = await renderFinance('/contas-fixas', { recurrences: [bill('Internet', INTERNET, 120, 10)] })

    await userEvent.click(await screen.findByRole('checkbox', { name: `Em aberto: Internet, ${formatMonth(month)}` }))
    expect(await screen.findByText('Conta marcada como paga.')).toBeInTheDocument()
    await waitFor(() => expect(totals()).toContain(`Pago${money(120)}`))
    expect(calls.some((call) => call.key === `POST /recurrences/1/months/${year}/${m}/settlement`)).toBe(true)

    await userEvent.click(screen.getByRole('checkbox', { name: `Paga: Internet, ${formatMonth(month)}` }))
    expect(await screen.findByText('Pagamento desfeito.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Ações de Internet' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Pagar em outra data' }))
    const dialog = await screen.findByRole('dialog', { name: 'Pagar em outra data' })
    const earlier = addMonthsToDate(todayIso(), -1)
    fireEvent.change(within(dialog).getByLabelText('Data do pagamento'), { target: { value: earlier } })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Pagar' }))
    await waitFor(() => expect(store.recurrences[0].months[0]?.settledOn).toBe(earlier))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('"Pagar com outro valor": ajusta só o mês e quita', async () => {
    await renderFinance('/contas-fixas', { recurrences: [bill('Luz', LUZ, 250, 15)] })

    await userEvent.click(await screen.findByRole('button', { name: 'Ações de Luz' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Pagar com outro valor' }))
    const dialog = await screen.findByRole('dialog', { name: 'Pagar com outro valor' })
    const amount = within(dialog).getByRole('textbox', { name: 'Valor' })
    await userEvent.clear(amount)
    await userEvent.type(amount, '31000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Pagar' }))

    expect(await screen.findByText('Conta marcada como paga.')).toBeInTheDocument()
    await waitFor(() => expect(totals()).toContain(`Pago${money(310)}`))
    expect(rows()[0].textContent!.replace(/\s/g, ' ')).toContain(`ajustado (normal ${money(250)})`)

    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    await screen.findByRole('list', { name: `Contas fixas de ${formatMonth(next)}` })
    await waitFor(() => expect(totals()).toContain(`Previsto${money(250)}`))
  })

  it('cadastra conta com início futuro: aparece só a partir dele', async () => {
    const { calls } = await renderFinance('/contas-fixas')
    await userEvent.click((await screen.findAllByRole('button', { name: 'Nova conta fixa' }))[0])
    const dialog = await screen.findByRole('dialog', { name: 'Nova conta fixa' })

    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Escola')
    await userEvent.selectOptions(within(dialog).getByLabelText('Categoria'), 'Educação')
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Valor por mês' }), '90000')
    await userEvent.clear(within(dialog).getByLabelText('Dia do vencimento'))
    await userEvent.type(within(dialog).getByLabelText('Dia do vencimento'), '8')
    await userEvent.click(within(within(dialog).getByRole('group', { name: 'Mês de início' })).getByRole('button', { name: 'Próximo mês' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))

    expect(await screen.findByText('Conta fixa cadastrada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /recurrences')!.init)).toMatchObject({
      kind: 'Expense',
      categoryId: EDUCACAO,
      amount: 900,
      dayOfMonth: 8,
      startMonth: next,
    })
    expect(await screen.findByText('Nenhuma conta fixa neste mês')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(await screen.findByRole('button', { name: 'Abrir Escola' })).toBeInTheDocument()
  })

  it('encerrada fica fora do mês e aparece em "Encerradas"', async () => {
    await renderFinance('/contas-fixas', {
      recurrences: [bill('Academia', LUZ, 99, 20, { endMonth: addMonths(month, -1) }), bill('Internet', INTERNET, 120, 10)],
    })

    await screen.findByRole('list', { name: `Contas fixas de ${formatMonth(month)}` })
    expect(rows()).toHaveLength(1)
    const ended = screen.getByRole('list', { name: 'Contas fixas encerradas' })
    expect(ended).toHaveTextContent('Academia')
    expect(ended).toHaveTextContent(`encerrada em ${formatMonth(addMonths(month, -1))}`)
  })

  it('mês sem contas mostra estado vazio', async () => {
    await renderFinance('/contas-fixas')
    expect(await screen.findByText('Nenhuma conta fixa neste mês')).toBeInTheDocument()
  })
})
