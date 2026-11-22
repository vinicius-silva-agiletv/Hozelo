import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { addMonthsToDate, todayIso } from '@/lib/date'
import { formatCurrency, formatDate } from '@/lib/format'
import { addMonths, currentMonth, formatMonth } from '@/lib/month'
import { CASA, renderExpenses } from '@/test/expenses-setup'
import { bodyOf } from '@/test/mock-api'

import { defaultFirstDueDate } from '../preview'

const month = currentMonth()
const money = (value: number) => formatCurrency(value).replace(/\s/g, ' ')
const text = (element: HTMLElement) => element.textContent!.replace(/\s/g, ' ')

async function openForm() {
  await userEvent.click((await screen.findAllByRole('button', { name: 'Nova despesa' }))[0])
  return screen.findByRole('dialog', { name: 'Nova despesa' })
}

const setDate = (dialog: HTMLElement, label: RegExp, value: string) =>
  fireEvent.change(within(dialog).getByLabelText(label), { target: { value } })

async function fillBasics(dialog: HTMLElement, { name = 'Geladeira', category = 'Casa', amount = '350000' } = {}) {
  await userEvent.type(within(dialog).getByLabelText('Nome'), name)
  await userEvent.selectOptions(within(dialog).getByLabelText('Categoria'), category)
  await userEvent.type(within(dialog).getByLabelText(/^Valor/), amount)
}

describe('Cadastrar despesa (US3)', () => {
  it('parcelada pelo total: resumo antes de salvar e parcela no mês depois', async () => {
    const { calls } = await renderExpenses()
    const dialog = await openForm()

    await fillBasics(dialog)
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Parcelado' }))
    await userEvent.clear(within(dialog).getByLabelText('Parcelas'))
    await userEvent.type(within(dialog).getByLabelText('Parcelas'), '10')
    setDate(dialog, /Primeiro vencimento/, `${month}-10`)

    const summary = within(dialog).getByTestId('expense-summary')
    expect(text(summary)).toContain(`10 × ${money(350)} · última em ${formatDate(addMonthsToDate(`${month}-10`, 9))}`)

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar despesa' }))
    expect(await screen.findByText('Despesa cadastrada.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    expect(bodyOf(calls.find((call) => call.key === 'POST /expenses')!.init)).toEqual({
      name: 'Geladeira',
      categoryId: CASA,
      amountType: 'Total',
      amount: 3500,
      isInstallment: true,
      installmentsCount: 10,
      firstDueDate: `${month}-10`,
      alreadyPaidInstallments: 0,
      notes: null,
      personId: null,
      personPercent: null,
    })
    const list = await screen.findByRole('list', { name: `Parcelas de ${formatMonth(month)}` })
    expect(list).toHaveTextContent('Geladeira')
    expect(list).toHaveTextContent('1/10')
  })

  it('modo valor da parcela mostra o total; sobra de centavos aparece no resumo', async () => {
    await renderExpenses()
    const dialog = await openForm()

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Parcelado' }))
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Valor da parcela' }))
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Valor da parcela' }), '100000')
    await userEvent.clear(within(dialog).getByLabelText('Parcelas'))
    await userEvent.type(within(dialog).getByLabelText('Parcelas'), '48')
    expect(text(within(dialog).getByTestId('expense-summary'))).toContain(`Total ${money(48000)}`)

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Valor total' }))
    await userEvent.clear(within(dialog).getByRole('textbox', { name: 'Valor' }))
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Valor' }), '10000')
    await userEvent.clear(within(dialog).getByLabelText('Parcelas'))
    await userEvent.type(within(dialog).getByLabelText('Parcelas'), '3')
    const summary = text(within(dialog).getByTestId('expense-summary'))
    expect(summary).toContain(`3 × ${money(33.33)}`)
    expect(summary).toContain(`A última parcela leva a sobra: ${money(33.34)}`)
  })

  it('compra antiga: sugere as parcelas pagas até a família editar o campo', async () => {
    const { calls } = await renderExpenses()
    const dialog = await openForm()
    const first = addMonthsToDate(`${month}-15`, -42)

    await fillBasics(dialog, { name: 'Carro', category: 'Transporte', amount: '100000' })
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Parcelado' }))
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Valor da parcela' }))
    await userEvent.clear(within(dialog).getByLabelText('Parcelas'))
    await userEvent.type(within(dialog).getByLabelText('Parcelas'), '48')
    setDate(dialog, /Primeiro vencimento/, first)

    const paid = within(dialog).getByLabelText('Parcelas já pagas')
    await waitFor(() => expect(paid).toHaveValue(42))
    expect(text(within(dialog).getByTestId('expense-summary'))).toContain('42 pagas · faltam 6')

    await userEvent.clear(paid)
    await userEvent.type(paid, '40')
    setDate(dialog, /Primeiro vencimento/, addMonthsToDate(first, -2))
    expect(paid).toHaveValue(40)

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar despesa' }))
    expect(await screen.findByText('Despesa cadastrada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /expenses')!.init)).toMatchObject({ alreadyPaidInstallments: 40 })
  })

  it('à vista gera uma parcela; vencimento padrão é hoje no mês aberto', async () => {
    const view = addMonths(month, 1)
    await renderExpenses(`/despesas?mes=${view}`)
    const dialog = await openForm()

    expect(within(dialog).getByLabelText('Vencimento')).toHaveValue(defaultFirstDueDate(view, todayIso()))
    await fillBasics(dialog, { name: 'Sofá', amount: '200000' })
    expect(text(within(dialog).getByTestId('expense-summary'))).toContain(`À vista · ${money(2000)}`)

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar despesa' }))
    const list = await screen.findByRole('list', { name: `Parcelas de ${formatMonth(view)}` })
    expect(list).toHaveTextContent('Sofá')
  })

  it('valida os campos antes de enviar e mostra recusas da API', async () => {
    const { calls } = await renderExpenses('/despesas', {
      routes: { 'POST /expenses': { status: 400, body: { errors: ['Categoria não encontrada.'] } } },
    })
    const dialog = await openForm()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar despesa' }))
    expect(await within(dialog).findByText('Informe o nome da despesa.')).toBeInTheDocument()
    expect(within(dialog).getByText('Escolha a categoria.')).toBeInTheDocument()
    expect(within(dialog).getByText('Informe um valor maior que zero.')).toBeInTheDocument()
    expect(calls.some((call) => call.key === 'POST /expenses')).toBe(false)

    await fillBasics(dialog)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar despesa' }))
    expect(await within(dialog).findByText('Categoria não encontrada.')).toBeInTheDocument()
  })

  it('sem categorias de despesa: aviso com atalho para Configurações', async () => {
    await renderExpenses('/despesas', { noCategories: true })
    const dialog = await openForm()

    expect(await within(dialog).findByText(/Crie uma categoria de despesa/)).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: 'Ir para Configurações' })).toHaveAttribute('href', '/configuracoes')
    expect(within(dialog).getByRole('button', { name: 'Cadastrar despesa' })).toBeDisabled()
  })
})
