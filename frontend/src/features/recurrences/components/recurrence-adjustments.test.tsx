import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { formatCurrency } from '@/lib/format'
import { addMonths, currentMonth, formatMonth } from '@/lib/month'
import { ACADEMIA, INTERNET, LUZ, renderFinance, SALARIO } from '@/test/finance-setup'
import { bodyOf } from '@/test/mock-api'
import { currentLocation } from '@/test/render'

const month = currentMonth()
const money = (value: number) => formatCurrency(value).replace(/\s/g, ' ')
const totals = () => screen.getByLabelText('Totais do mês').textContent!.replace(/\s/g, ' ')
const rowOf = (name: string) => screen.getByRole('button', { name: `Abrir ${name}` }).closest('li')!
const bill = (name: string, categoryId: number, amount: number, dayOfMonth: number) => ({
  kind: 'Expense' as const,
  name,
  categoryId,
  amount,
  dayOfMonth,
  startMonth: addMonths(month, -3),
})

async function menu(name: string, item: string) {
  await userEvent.click(await screen.findByRole('button', { name: `Ações de ${name}` }))
  await userEvent.click(await screen.findByRole('menuitem', { name: item }))
}

describe('Ajustes de recorrência (US5)', () => {
  it('ajusta só o mês e mostra "ajustado (normal R$ X)"', async () => {
    const { store } = await renderFinance('/contas-fixas', { recurrences: [bill('Luz', LUZ, 250, 15)] })

    await menu('Luz', 'Ajustar este mês')
    const dialog = await screen.findByRole('dialog', { name: 'Ajustar este mês' })
    const amount = within(dialog).getByRole('textbox', { name: 'Valor deste mês' })
    await userEvent.clear(amount)
    await userEvent.type(amount, '31000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Ajustar' }))

    expect(await screen.findByText('Valor do mês ajustado.')).toBeInTheDocument()
    await waitFor(() => expect(rowOf('Luz').textContent!.replace(/\s/g, ' ')).toContain(`ajustado (normal ${money(250)})`))
    expect(store.recurrences[0].months).toEqual([{ month, amount: 310, skipped: false, settledOn: null }])
    expect(totals()).toContain(`Previsto${money(310)}`)
  })

  it('pula o mês (fora dos totais, sem caixa) e desfaz', async () => {
    await renderFinance('/contas-fixas', { recurrences: [bill('Academia', ACADEMIA, 99, 20), bill('Internet', INTERNET, 120, 10)] })

    await menu('Academia', 'Pular este mês')
    expect(await screen.findByText('Mês pulado.')).toBeInTheDocument()
    await waitFor(() => expect(rowOf('Academia')).toHaveTextContent('pulada'))
    expect(within(rowOf('Academia')).queryByRole('checkbox')).not.toBeInTheDocument()
    expect(totals()).toContain(`Previsto${money(120)}`)

    await menu('Academia', 'Desfazer ajuste')
    expect(await screen.findByText('Ajuste desfeito.')).toBeInTheDocument()
    await waitFor(() => expect(rowOf('Academia')).not.toHaveTextContent('pulada'))
    expect(totals()).toContain(`Previsto${money(219)}`)
  })

  it('muda o valor a partir de um mês, encerra e reabre pelo detalhe', async () => {
    const { calls } = await renderFinance('/contas-fixas', { recurrences: [bill('Internet', INTERNET, 120, 10)] })

    await userEvent.click(await screen.findByRole('button', { name: 'Abrir Internet' }))
    expect(currentLocation()).toContain('recorrencia=1')
    const detail = await screen.findByRole('dialog', { name: 'Internet' })

    await userEvent.click(within(detail).getByRole('button', { name: 'Mudar valor' }))
    const change = await screen.findByRole('dialog', { name: 'Mudar valor' })
    const amount = within(change).getByRole('textbox', { name: 'Novo valor' })
    await userEvent.clear(amount)
    await userEvent.type(amount, '13500')
    const from = within(change).getByRole('group', { name: 'A partir de' })
    await userEvent.click(within(from).getByRole('button', { name: 'Próximo mês' }))
    await userEvent.click(within(from).getByRole('button', { name: 'Próximo mês' }))
    await userEvent.click(within(change).getByRole('button', { name: 'Mudar valor' }))

    expect(await screen.findByText('Valor alterado.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'PUT /recurrences/1/amount')!.init)).toEqual({ amount: 135, fromMonth: addMonths(month, 2) })
    const history = within(screen.getByRole('dialog', { name: 'Internet' })).getByRole('region', { name: 'Histórico de valores' })
    await waitFor(() => expect(history).toHaveTextContent(`A partir de ${formatMonth(addMonths(month, 2))}`))

    await userEvent.click(within(screen.getByRole('dialog', { name: 'Internet' })).getByRole('button', { name: 'Encerrar' }))
    const end = await screen.findByRole('dialog', { name: 'Encerrar' })
    await userEvent.click(within(end).getByRole('button', { name: 'Encerrar' }))
    expect(await screen.findByText('Recorrência encerrada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'PUT /recurrences/1/end')!.init)).toEqual({ endMonth: month })

    await userEvent.click(await within(screen.getByRole('dialog', { name: 'Internet' })).findByRole('button', { name: 'Reabrir' }))
    expect(await screen.findByText('Recorrência reaberta.')).toBeInTheDocument()
    expect(calls.some((call) => call.key === 'DELETE /recurrences/1/end')).toBe(true)
  })

  it('edita dados (sem valor e início) e remove com confirmação', async () => {
    const { calls } = await renderFinance(`/contas-fixas?recorrencia=1`, { recurrences: [bill('Internet', INTERNET, 120, 10)] })

    const detail = await screen.findByRole('dialog', { name: 'Internet' })
    await userEvent.click(await within(detail).findByRole('button', { name: 'Editar' }))
    const form = await screen.findByRole('dialog', { name: 'Editar recorrência' })
    expect(within(form).queryByRole('textbox', { name: 'Valor por mês' })).not.toBeInTheDocument()
    expect(within(form).queryByRole('group', { name: 'Mês de início' })).not.toBeInTheDocument()
    await userEvent.clear(within(form).getByLabelText('Nome'))
    await userEvent.type(within(form).getByLabelText('Nome'), 'Internet fibra')
    await userEvent.click(within(form).getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Recorrência atualizada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'PUT /recurrences/1')!.init)).toMatchObject({ name: 'Internet fibra', dayOfMonth: 10 })

    await userEvent.click(within(await screen.findByRole('dialog', { name: 'Internet fibra' })).getByRole('button', { name: 'Remover' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Remover recorrência?' })
    await userEvent.click(within(confirm).getByRole('button', { name: 'Remover' }))
    expect(await screen.findByText('Recorrência removida.')).toBeInTheDocument()
    await waitFor(() => expect(currentLocation()).not.toContain('recorrencia='))
    expect(await screen.findByText('Nenhuma conta fixa neste mês')).toBeInTheDocument()
  })

  it('os mesmos ajustes no salário pela tela de Receitas', async () => {
    await renderFinance('/receitas', {
      recurrences: [{ kind: 'Income', name: 'Salário', categoryId: SALARIO, amount: 6000, dayOfMonth: 5, startMonth: month }],
    })

    await menu('Salário', 'Pular este mês')
    expect(await screen.findByText('Mês pulado.')).toBeInTheDocument()
    expect(await screen.findByText('Nenhuma receita neste mês')).toBeInTheDocument()
  })

  it('recorrência inexistente no endereço: avisa e fecha', async () => {
    await renderFinance('/contas-fixas?recorrencia=99')
    expect(await screen.findByText('Recorrência não encontrada.')).toBeInTheDocument()
    await waitFor(() => expect(currentLocation()).not.toContain('recorrencia='))
  })
})
