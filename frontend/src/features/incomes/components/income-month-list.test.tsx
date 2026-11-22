import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { formatCurrency } from '@/lib/format'
import { addMonths, currentMonth, formatMonth } from '@/lib/month'
import { DECIMO, renderFinance, SALARIO, VENDAS } from '@/test/finance-setup'
import { currentLocation } from '@/test/render'

const month = currentMonth()
const next = addMonths(month, 1)
const money = (value: number) => formatCurrency(value).replace(/\s/g, ' ')
const totals = () => screen.getByLabelText('Totais do mês').textContent!.replace(/\s/g, ' ')
const rows = () => within(screen.getByRole('list', { name: /^Receitas de/ })).getAllByRole('listitem')

const seed = {
  recurrences: [{ kind: 'Income' as const, name: 'Salário', categoryId: SALARIO, amount: 6000, dayOfMonth: 5, startMonth: month }],
  incomes: [
    { name: '13º salário', categoryId: DECIMO, amount: 3000, expectedDate: `${month}-20` },
    { name: 'Venda da bicicleta', categoryId: VENDAS, amount: 500, expectedDate: `${month}-25`, receivedOn: `${month}-01` },
  ],
  reimbursements: [{ month, name: 'Esposa', amount: 400, date: `${month}-12`, settled: true }],
}

describe('Receitas do mês (US1)', () => {
  it('lista avulsas, recorrentes e reembolsos em ordem, com totais da API', async () => {
    await renderFinance('/receitas', seed)

    expect(await screen.findByRole('heading', { level: 1, name: 'Receitas' })).toBeInTheDocument()
    expect(document.title).toBe('Receitas · Hozelo')
    await screen.findByRole('list', { name: `Receitas de ${formatMonth(month)}` })

    const texts = rows().map((row) => row.textContent)
    expect(texts[0]).toContain('Salário')
    expect(texts[0]).toContain('recorrente')
    expect(texts[1]).toContain('Esposa')
    expect(texts[1]).toContain('reembolso')
    expect(texts[2]).toContain('13º salário')
    expect(texts[3]).toContain('Venda da bicicleta')

    expect(totals()).toContain(`Previsto${money(9900)}`)
    expect(totals()).toContain(`Recebido${money(900)}`)
    expect(totals()).toContain(`A receber${money(9000)}`)
  })

  it('reembolso parcial mostra pago de previsto e o a receber vem de previsto − recebido', async () => {
    await renderFinance('/receitas', {
      reimbursements: [{ month, name: 'Reembolso — Esposa', amount: 120, date: `${month}-01`, settledAmount: 60 }],
    })
    await screen.findByRole('list', { name: `Receitas de ${formatMonth(month)}` })
    expect(rows()[0].textContent!.replace(/\s/g, ' ')).toContain(`${money(60)}de ${money(120)}`)
    expect(totals()).toContain(`Previsto${money(120)}`)
    expect(totals()).toContain(`Recebido${money(60)}`)
    expect(totals()).toContain(`A receber${money(60)}`)
  })

  it('reembolso é só leitura e leva à área Pessoas', async () => {
    await renderFinance('/receitas', seed)
    await screen.findByRole('list', { name: `Receitas de ${formatMonth(month)}` })

    const row = rows()[1]
    expect(within(row).queryByRole('checkbox')).not.toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: /Ações/ })).not.toBeInTheDocument()
    await userEvent.click(within(row).getByRole('button', { name: 'Reembolso de Esposa, ver em Pessoas' }))
    await waitFor(() => expect(currentLocation()).toBe('/pessoas'))
  })

  it('troca o mês e filtra por categoria, mantendo no endereço', async () => {
    await renderFinance('/receitas', seed)
    await screen.findByRole('list', { name: `Receitas de ${formatMonth(month)}` })

    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    await screen.findByRole('list', { name: `Receitas de ${formatMonth(next)}` })
    expect(currentLocation()).toContain(`mes=${next}`)
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('Salário')

    await userEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    await userEvent.selectOptions(await screen.findByLabelText('Categoria'), '13º salário')
    expect(currentLocation()).toContain(`categoria=${DECIMO}`)
    await waitFor(() => expect(rows()).toHaveLength(1))
    expect(rows()[0]).toHaveTextContent('13º salário')
  })

  it('mês pulado do salário não aparece; mês vazio mostra "Nova receita"', async () => {
    await renderFinance(`/receitas?mes=${next}`, {
      recurrences: [{ ...seed.recurrences[0], months: [{ month: next, amount: null, skipped: true, settledOn: null }] }],
    })
    expect(await screen.findByText('Nenhuma receita neste mês')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Nova receita' }).length).toBeGreaterThanOrEqual(2)
  })

  it('falha ao carregar mostra "Tentar novamente"', async () => {
    const [y, m] = month.split('-').map(Number)
    let fail = true
    const { store } = await renderFinance('/receitas', {
      routes: {
        [`GET /summaries?year=${y}&month=${m}`]: () =>
          fail ? { status: 400, body: { errors: ['Erro ao carregar.'] } } : (store.routes['*'] as (i: RequestInit, k: string) => never)({}, `GET /summaries?year=${y}&month=${m}`),
      },
    })
    expect(await screen.findByText('Erro ao carregar.')).toBeInTheDocument()
    fail = false
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Nenhuma receita neste mês')).toBeInTheDocument()
  })
})
