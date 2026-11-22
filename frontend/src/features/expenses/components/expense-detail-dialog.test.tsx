import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { addMonthsToDate, todayIso } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import { currentMonth } from '@/lib/month'
import { CASA, MORADIA, renderExpenses, TRANSPORTE } from '@/test/expenses-setup'
import { bodyOf } from '@/test/mock-api'
import { currentLocation } from '@/test/render'

const month = currentMonth()
const money = (value: number) => formatCurrency(value).replace(/\s/g, ' ')
const seed = [
  { name: 'Aluguel', categoryId: MORADIA, amount: 1200, firstDueDate: addMonthsToDate(`${month}-05`, -1), alreadyPaidInstallments: 1 },
  { name: 'Geladeira', categoryId: CASA, amount: 3500, installmentsCount: 10, firstDueDate: `${month}-10`, notes: 'Loja do centro' },
  {
    name: 'Carro',
    categoryId: TRANSPORTE,
    amount: 1000,
    amountType: 'Installment' as const,
    installmentsCount: 48,
    firstDueDate: addMonthsToDate(`${month}-03`, -16),
    alreadyPaidInstallments: 16,
  },
]

const cards = () => within(screen.getByRole('list', { name: 'Despesas' })).getAllByRole('button', { name: /^Abrir/ })

describe('Aba Todas (US4)', () => {
  it('lista pelo próximo vencimento, quitadas por último, com totais e filtros no endereço', async () => {
    await renderExpenses('/despesas?aba=todas', { expenses: seed })

    await screen.findByRole('list', { name: 'Despesas' })
    expect(cards().map((card) => card.getAttribute('aria-label'))).toEqual(['Abrir Carro', 'Abrir Geladeira', 'Abrir Aluguel'])
    expect(cards()[2]).toHaveTextContent('Quitada')
    expect(cards()[0]).toHaveTextContent('16/48 pagas')
    expect(cards()[0].textContent!.replace(/\s/g, ' ')).toContain(`Restante ${money(32000)}`)
    const totals = screen.getByLabelText('Totais das despesas').textContent!.replace(/\s/g, ' ')
    expect(totals).toContain(`Pago${money(17200)}`)
    expect(totals).toContain(`Restante${money(35500)}`)

    await userEvent.selectOptions(screen.getByLabelText('Situação'), 'Quitadas')
    expect(currentLocation()).toContain('situacao=quitadas')
    await waitFor(() => expect(cards()).toHaveLength(1))

    await userEvent.selectOptions(screen.getByLabelText('Situação'), 'Todas')
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Casa')
    await waitFor(() => expect(cards().map((card) => card.getAttribute('aria-label'))).toEqual(['Abrir Geladeira']))
  })
})

describe('Detalhe, editar e remover (US4)', () => {
  it('abre pelo toque na parcela do mês, mostra dados e parcelas, e "voltar" fecha', async () => {
    await renderExpenses('/despesas', { expenses: seed })

    await userEvent.click(await screen.findByRole('button', { name: 'Abrir Geladeira' }))
    const dialog = await screen.findByRole('dialog', { name: 'Geladeira' })
    expect(currentLocation()).toContain('despesa=2')
    expect(within(dialog).getByText('Casa · 10 parcelas')).toBeInTheDocument()
    expect(within(dialog).getByText('Loja do centro')).toBeInTheDocument()
    expect(within(within(dialog).getByRole('list', { name: 'Parcelas' })).getAllByRole('listitem')).toHaveLength(10)

    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Em aberto: Geladeira, parcela 2 de 10' }))
    expect(await screen.findByText('Parcela marcada como paga.')).toBeInTheDocument()
    await waitFor(() => expect(within(dialog).getByText('1/10 pagas')).toBeInTheDocument())

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(currentLocation()).not.toContain('despesa='))
  })

  it('edita no mesmo modo de valor e recalcula as parcelas', async () => {
    const { calls } = await renderExpenses('/despesas?aba=todas&despesa=2', { expenses: seed })

    const detail = await screen.findByRole('dialog', { name: 'Geladeira' })
    await userEvent.click(await within(detail).findByRole('button', { name: 'Editar' }))
    const form = await screen.findByRole('dialog', { name: 'Editar despesa' })
    expect(within(form).getByLabelText('Nome')).toHaveValue('Geladeira')
    expect(within(form).getByRole('radio', { name: 'Valor total' })).toBeChecked()
    expect(within(form).getByRole('textbox', { name: 'Valor' })).toHaveValue(formatCurrency(3500))
    expect(within(form).queryByLabelText('Parcelas já pagas')).not.toBeInTheDocument()

    await userEvent.clear(within(form).getByLabelText('Parcelas'))
    await userEvent.type(within(form).getByLabelText('Parcelas'), '12')
    await userEvent.click(within(form).getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Despesa atualizada.')).toBeInTheDocument()
    const body = bodyOf(calls.find((call) => call.key === 'PUT /expenses/2')!.init)
    expect(body).toMatchObject({ installmentsCount: 12, amountType: 'Total', amount: 3500 })
    expect(body).not.toHaveProperty('alreadyPaidInstallments')
    await waitFor(() =>
      expect(within(screen.getByRole('dialog', { name: 'Geladeira' })).getByText('Casa · 12 parcelas')).toBeInTheDocument(),
    )
  })

  it('edição recusada pela API (parcelas amortizadas) mostra a mensagem', async () => {
    const { store } = await renderExpenses('/despesas?despesa=3', { expenses: seed })
    Object.assign(store.items[2].installments[47], { isPaid: true, paidOn: todayIso(), paidAmount: 900, prepaid: true })

    const detail = await screen.findByRole('dialog', { name: 'Carro' })
    await userEvent.click(await within(detail).findByRole('button', { name: 'Editar' }))
    const form = await screen.findByRole('dialog', { name: 'Editar despesa' })
    expect(within(form).getByRole('radio', { name: 'Valor da parcela' })).toBeChecked()
    await userEvent.click(within(form).getByRole('button', { name: 'Salvar' }))

    expect(await within(form).findByText(/parcelas amortizadas/)).toBeInTheDocument()
  })

  it('remove com confirmação e fecha o detalhe', async () => {
    await renderExpenses('/despesas?aba=todas&despesa=2', { expenses: seed })

    const detail = await screen.findByRole('dialog', { name: 'Geladeira' })
    await userEvent.click(await within(detail).findByRole('button', { name: 'Remover' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Remover despesa?' })
    expect(within(confirm).getByText(/todas as suas parcelas serão removidas/)).toBeInTheDocument()
    await userEvent.click(within(confirm).getByRole('button', { name: 'Remover' }))

    expect(await screen.findByText('Despesa removida.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(currentLocation()).not.toContain('despesa=')
    await waitFor(() => expect(cards().map((card) => card.getAttribute('aria-label'))).toEqual(['Abrir Carro', 'Abrir Aluguel']))
  })

  it('despesa inexistente: avisa e fecha o detalhe', async () => {
    await renderExpenses('/despesas?despesa=99', { expenses: seed })

    expect(await screen.findByText('Despesa não encontrada.')).toBeInTheDocument()
    await waitFor(() => expect(currentLocation()).not.toContain('despesa='))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
