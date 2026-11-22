import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { addMonthsToDate, parseIsoDate, todayIso } from '@/lib/date'
import { addMonths, currentMonth, formatMonth } from '@/lib/month'
import { DECIMO, renderFinance, SALARIO } from '@/test/finance-setup'
import { bodyOf } from '@/test/mock-api'

import { defaultFirstDueDate } from '@/features/expenses/preview'

const month = currentMonth()

async function openForm() {
  await userEvent.click((await screen.findAllByRole('button', { name: 'Nova receita' }))[0])
  return screen.findByRole('dialog', { name: 'Nova receita' })
}

describe('Cadastrar receitas (US3)', () => {
  it('avulsa aparece no mês, com data padrão hoje no mês aberto', async () => {
    const { calls } = await renderFinance('/receitas')
    const dialog = await openForm()

    expect(within(dialog).getByLabelText('Data prevista')).toHaveValue(defaultFirstDueDate(month, todayIso()))
    await userEvent.type(within(dialog).getByLabelText('Nome'), '13º salário (1ª parcela)')
    await userEvent.selectOptions(within(dialog).getByLabelText('Categoria'), '13º salário')
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Valor' }), '300000')
    fireEvent.change(within(dialog).getByLabelText('Data prevista'), { target: { value: `${month}-20` } })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))

    expect(await screen.findByText('Receita cadastrada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /incomes')!.init)).toEqual({
      name: '13º salário (1ª parcela)',
      categoryId: DECIMO,
      amount: 3000,
      expectedDate: `${month}-20`,
      notes: null,
    })
    expect(await screen.findByRole('list', { name: `Receitas de ${formatMonth(month)}` })).toHaveTextContent('13º salário (1ª parcela)')
  })

  it('"Já recebida" envia a data e recusa data futura', async () => {
    const { calls } = await renderFinance('/receitas')
    const dialog = await openForm()

    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Venda')
    await userEvent.selectOptions(within(dialog).getByLabelText('Categoria'), 'Vendas')
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Valor' }), '50000')
    await userEvent.click(within(dialog).getByRole('switch', { name: 'Já recebida' }))
    fireEvent.change(within(dialog).getByLabelText('Recebida em'), { target: { value: addMonthsToDate(todayIso(), 1) } })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))
    expect(await within(dialog).findByText('A data não pode ser futura.')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText('Recebida em'), { target: { value: todayIso() } })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))
    expect(await screen.findByText('Receita cadastrada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /incomes')!.init)).toMatchObject({ receivedOn: todayIso() })
  })

  it('"Todo mês" cria a recorrente com início no mês aberto e dia de hoje; aparece nos meses seguintes', async () => {
    const { calls } = await renderFinance('/receitas')
    const dialog = await openForm()

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Todo mês' }))
    expect(within(dialog).getByLabelText('Dia do recebimento')).toHaveValue(parseIsoDate(todayIso()).day)
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Salário')
    await userEvent.selectOptions(within(dialog).getByLabelText('Categoria'), 'Salário')
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Valor por mês' }), '600000')
    await userEvent.clear(within(dialog).getByLabelText('Dia do recebimento'))
    await userEvent.type(within(dialog).getByLabelText('Dia do recebimento'), '5')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))

    expect(await screen.findByText('Receita recorrente cadastrada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /recurrences')!.init)).toEqual({
      kind: 'Income',
      name: 'Salário',
      categoryId: SALARIO,
      amount: 6000,
      dayOfMonth: 5,
      startMonth: month,
      endMonth: null,
      notes: null,
      personId: null,
      personPercent: null,
    })
    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(await screen.findByRole('list', { name: `Receitas de ${formatMonth(addMonths(month, 1))}` })).toHaveTextContent('Salário')
  })

  it('fim da recorrente é respeitado e não pode ser antes do início', async () => {
    const { calls } = await renderFinance('/receitas')
    const dialog = await openForm()

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Todo mês' }))
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Bico')
    await userEvent.selectOptions(within(dialog).getByLabelText('Categoria'), 'Vendas')
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Valor por mês' }), '30000')
    await userEvent.click(within(dialog).getByRole('switch', { name: 'Tem data para terminar' }))
    const end = within(dialog).getByRole('group', { name: 'Último mês' })
    await userEvent.click(within(end).getByRole('button', { name: 'Mês anterior' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))
    expect(await within(dialog).findByText('O fim não pode ser antes do início.')).toBeInTheDocument()

    await userEvent.click(within(end).getByRole('button', { name: 'Próximo mês' }))
    await userEvent.click(within(end).getByRole('button', { name: 'Próximo mês' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))
    expect(await screen.findByText('Receita recorrente cadastrada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /recurrences')!.init)).toMatchObject({ endMonth: addMonths(month, 1) })

    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(await screen.findByText('Nenhuma receita neste mês')).toBeInTheDocument()
  })

  it('valida os campos e mostra recusas da API', async () => {
    const { calls } = await renderFinance('/receitas', {
      routes: { 'POST /incomes': { status: 400, body: { errors: ['Categoria não encontrada.'] } } },
    })
    const dialog = await openForm()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))
    expect(await within(dialog).findByText('Informe o nome da receita.')).toBeInTheDocument()
    expect(within(dialog).getByText('Escolha a categoria.')).toBeInTheDocument()
    expect(within(dialog).getByText('Informe um valor maior que zero.')).toBeInTheDocument()
    expect(calls.some((call) => call.key === 'POST /incomes')).toBe(false)

    await userEvent.type(within(dialog).getByLabelText('Nome'), 'X')
    await userEvent.selectOptions(within(dialog).getByLabelText('Categoria'), 'Vendas')
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Valor' }), '100')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))
    expect(await within(dialog).findByText('Categoria não encontrada.')).toBeInTheDocument()

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Todo mês' }))
    await userEvent.clear(within(dialog).getByLabelText('Dia do recebimento'))
    await userEvent.type(within(dialog).getByLabelText('Dia do recebimento'), '32')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))
    await waitFor(() => expect(within(dialog).getByText('Informe um dia de 1 a 31.')).toBeInTheDocument())
  })

  it('sem categorias de receita: aviso com atalho para Configurações', async () => {
    await renderFinance('/receitas', { noIncomeCategories: true })
    const dialog = await openForm()

    expect(await within(dialog).findByText(/Crie uma categoria de receita/)).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: 'Ir para Configurações' })).toHaveAttribute('href', '/configuracoes')
  })
})
