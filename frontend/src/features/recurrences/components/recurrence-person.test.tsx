import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { addMonths, currentMonth } from '@/lib/month'
import { INTERNET, renderFinance } from '@/test/finance-setup'
import { person } from '@/test/expenses-setup'
import { bodyOf } from '@/test/mock-api'

const month = currentMonth()
const people = [person(1, 'Sogro'), person(2, 'Esposa')]

async function openNewBill(options: Parameters<typeof renderFinance>[1] = {}) {
  const api = await renderFinance('/contas-fixas', { people, ...options })
  await userEvent.click((await screen.findAllByRole('button', { name: 'Nova conta fixa' }))[0])
  const dialog = await screen.findByRole('dialog', { name: 'Nova conta fixa' })
  await userEvent.type(within(dialog).getByLabelText('Nome'), 'Internet')
  await userEvent.selectOptions(within(dialog).getByLabelText('Categoria'), 'Internet')
  await userEvent.type(within(dialog).getByRole('textbox', { name: 'Valor por mês' }), '12000')
  return { ...api, dialog }
}

describe('Dividir conta fixa com uma pessoa (US7)', () => {
  it('percentual mostra a parte por mês e aparece na lista', async () => {
    const { dialog, calls } = await openNewBill()

    await userEvent.click(within(dialog).getByRole('switch', { name: 'Dividir com uma pessoa' }))
    await userEvent.selectOptions(within(dialog).getByLabelText('Pessoa'), 'Esposa')
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Percentual' }))
    await userEvent.type(within(dialog).getByLabelText('Percentual (%)'), '50')
    expect(within(dialog).getByText(/^Parte de Esposa: R\$\s60,00 por mês$/)).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))

    expect(await screen.findByText('Conta fixa cadastrada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /recurrences')!.init)).toMatchObject({ personId: 2, personPercent: 50 })
    expect(await screen.findByText('Esposa · 50%')).toBeInTheDocument()
  })

  it('integral envia 100%; validações de pessoa e percentual', async () => {
    const { dialog, calls } = await openNewBill()

    await userEvent.click(within(dialog).getByRole('switch', { name: 'Dividir com uma pessoa' }))
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Percentual' }))
    await userEvent.type(within(dialog).getByLabelText('Percentual (%)'), '0')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))
    expect(await within(dialog).findByText('Escolha a pessoa.')).toBeInTheDocument()
    expect(within(dialog).getByText('Informe um percentual de 1 a 100.')).toBeInTheDocument()

    await userEvent.selectOptions(within(dialog).getByLabelText('Pessoa'), 'Sogro')
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Integral' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))
    expect(await screen.findByText('Conta fixa cadastrada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /recurrences')!.init)).toMatchObject({ personId: 1, personPercent: 100 })
  })

  it('sem pessoas a opção explica onde cadastrar', async () => {
    const { dialog } = await openNewBill({ people: [] })
    expect(await within(dialog).findByText('Cadastre pessoas na área Pessoas para dividir despesas.')).toBeInTheDocument()
    expect(within(dialog).getByRole('switch', { name: 'Dividir com uma pessoa' })).toBeDisabled()
  })

  it('receita recorrente não oferece a divisão; detalhe mostra a pessoa da conta fixa', async () => {
    await renderFinance('/contas-fixas?recorrencia=1', {
      people,
      recurrences: [
        { kind: 'Expense', name: 'Internet', categoryId: INTERNET, amount: 120, dayOfMonth: 10, startMonth: addMonths(month, -1), personId: 2, personPercent: 50 },
      ],
    })
    const detail = await screen.findByRole('dialog', { name: 'Internet' })
    expect(await within(detail).findByText('Esposa · 50%')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await userEvent.click(within(screen.getByRole('navigation', { name: 'Menu principal' })).getByRole('link', { name: 'Receitas' }))
    await userEvent.click((await screen.findAllByRole('button', { name: 'Nova receita' }))[0])
    const form = await screen.findByRole('dialog', { name: 'Nova receita' })
    await userEvent.click(within(form).getByRole('radio', { name: 'Todo mês' }))
    expect(within(form).queryByRole('switch', { name: 'Dividir com uma pessoa' })).not.toBeInTheDocument()
  })
})
