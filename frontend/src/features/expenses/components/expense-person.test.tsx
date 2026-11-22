import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { currentMonth } from '@/lib/month'
import { CASA, person, renderExpenses } from '@/test/expenses-setup'
import { bodyOf } from '@/test/mock-api'

const month = currentMonth()
const people = [person(1, 'Sogro'), person(2, 'Esposa')]

async function openFilledForm(options: Parameters<typeof renderExpenses>[1] = {}) {
  const api = await renderExpenses('/despesas', { people, ...options })
  await userEvent.click((await screen.findAllByRole('button', { name: 'Nova despesa' }))[0])
  const dialog = await screen.findByRole('dialog', { name: 'Nova despesa' })
  await userEvent.type(within(dialog).getByLabelText('Nome'), 'Geladeira')
  await userEvent.selectOptions(within(dialog).getByLabelText('Categoria'), 'Casa')
  await userEvent.click(within(dialog).getByRole('radio', { name: 'Parcelado' }))
  await userEvent.clear(within(dialog).getByLabelText('Parcelas'))
  await userEvent.type(within(dialog).getByLabelText('Parcelas'), '10')
  await userEvent.type(within(dialog).getByRole('textbox', { name: 'Valor' }), '350000')
  return { ...api, dialog }
}

describe('Dividir com uma pessoa (US6)', () => {
  it('percentual mostra a parte por parcela e envia pessoa e percentual', async () => {
    const { dialog, calls } = await openFilledForm()

    await userEvent.click(within(dialog).getByRole('switch', { name: 'Dividir com uma pessoa' }))
    await userEvent.selectOptions(within(dialog).getByLabelText('Pessoa'), 'Sogro')
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Percentual' }))
    await userEvent.type(within(dialog).getByLabelText('Percentual (%)'), '50')
    expect(within(dialog).getByText(/^Parte de Sogro: R\$\s175,00 por parcela$/)).toBeInTheDocument()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar despesa' }))
    expect(await screen.findByText('Despesa cadastrada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /expenses')!.init)).toMatchObject({ personId: 1, personPercent: 50 })
  })

  it('integral envia 100% e a lista mostra a pessoa', async () => {
    const { dialog, calls } = await openFilledForm()

    await userEvent.click(within(dialog).getByRole('switch', { name: 'Dividir com uma pessoa' }))
    await userEvent.selectOptions(within(dialog).getByLabelText('Pessoa'), 'Esposa')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar despesa' }))

    expect(await screen.findByText('Despesa cadastrada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /expenses')!.init)).toMatchObject({ personId: 2, personPercent: 100 })

    await userEvent.click(screen.getByRole('tab', { name: 'Todas' }))
    expect(await screen.findByText('Esposa · 100%')).toBeInTheDocument()
  })

  it('valida pessoa e percentual', async () => {
    const { dialog } = await openFilledForm()

    await userEvent.click(within(dialog).getByRole('switch', { name: 'Dividir com uma pessoa' }))
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Percentual' }))
    await userEvent.type(within(dialog).getByLabelText('Percentual (%)'), '120')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar despesa' }))

    expect(await within(dialog).findByText('Escolha a pessoa.')).toBeInTheDocument()
    expect(within(dialog).getByText('Informe um percentual de 1 a 100.')).toBeInTheDocument()
  })

  it('sem pessoas cadastradas a opção explica onde cadastrar', async () => {
    const { dialog } = await openFilledForm({ people: [] })

    expect(await within(dialog).findByText('Cadastre pessoas na área Pessoas para dividir despesas.')).toBeInTheDocument()
    expect(within(dialog).getByRole('switch', { name: 'Dividir com uma pessoa' })).toBeDisabled()
  })

  it('edição remove a pessoa e o detalhe mostra a divisão', async () => {
    const { calls } = await renderExpenses('/despesas?despesa=1', {
      people,
      expenses: [{ name: 'Fatura', categoryId: CASA, amount: 800, firstDueDate: `${month}-12`, personId: 2, personPercent: 50 }],
    })

    const detail = await screen.findByRole('dialog', { name: 'Fatura' })
    expect(await within(detail).findByText('Esposa · 50%')).toBeInTheDocument()
    await userEvent.click(within(detail).getByRole('button', { name: 'Editar' }))
    const form = await screen.findByRole('dialog', { name: 'Editar despesa' })
    expect(within(form).getByLabelText('Percentual (%)')).toHaveValue(50)

    await userEvent.click(within(form).getByRole('switch', { name: 'Dividir com uma pessoa' }))
    await userEvent.click(within(form).getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Despesa atualizada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'PUT /expenses/1')!.init)).toMatchObject({ personId: null, personPercent: null })
    await waitFor(() => expect(within(screen.getByRole('dialog', { name: 'Fatura' })).queryByText('Esposa · 50%')).not.toBeInTheDocument())
  })
})
