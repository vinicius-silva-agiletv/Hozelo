import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { formatCurrency } from '@/lib/format'
import { addMonths, currentMonth, formatMonth } from '@/lib/month'
import { currentLocation } from '@/test/render'
import { CASA, DECIMO, INTERNET, renderSummary, SALARIO } from '@/test/summary-setup'
import type { SeedLedgerItem } from '@/test/summary-store'

const month = currentMonth()
const prev = addMonths(month, -1)
const next = addMonths(month, 1)
const money = (value: number) => formatCurrency(value).replace(/\s/g, ' ')
const text = (element: HTMLElement) => element.textContent!.replace(/\s/g, ' ')

const items: SeedLedgerItem[] = [
  { source: 'Recurrence', sourceId: 1, direction: 'Income', name: 'Salário', category: SALARIO, month, date: `${month}-05`, amount: 6000, isSettled: true, settledAmount: 6000 },
  { source: 'Income', sourceId: 2, direction: 'Income', name: '13º salário', category: DECIMO, month, date: `${month}-20`, amount: 2500 },
  { source: 'Installment', sourceId: 7, number: 3, installmentsCount: 10, direction: 'Expense', name: 'Geladeira', category: CASA, month, date: `${month}-10`, amount: 350, isSettled: true, settledAmount: 350 },
  { source: 'Recurrence', sourceId: 4, direction: 'Expense', name: 'Internet', category: INTERNET, month, date: `${month}-12`, amount: 120 },
  { source: 'Installment', sourceId: 8, number: 1, installmentsCount: 1, direction: 'Expense', name: 'Aluguel', category: CASA, month, date: `${month}-01`, amount: 5650, isSettled: true, settledAmount: 4520 },
]

describe('Previsto e realizado (US1)', () => {
  it('cartões com os valores da API e troca de mês no endereço', async () => {
    await renderSummary('/', { items })

    expect(await screen.findByRole('heading', { level: 1, name: 'Resumo do mês' })).toBeInTheDocument()
    expect(document.title).toBe('Resumo do mês · Hozelo')
    const forecast = await screen.findByRole('region', { name: 'Previsto' })
    expect(text(forecast)).toContain(`Entradas${money(8500)}`)
    expect(text(forecast)).toContain(`Saídas${money(6120)}`)
    expect(text(forecast)).toContain(`Saldo${money(2380)}`)
    const realized = screen.getByRole('region', { name: 'Realizado' })
    expect(text(realized)).toContain(`Recebido${money(6000)}`)
    expect(text(realized)).toContain(`Pago${money(4870)}`)
    expect(text(realized)).toContain(`Saldo${money(1130)}`)

    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(currentLocation()).toBe(`/?mes=${next}`)
    expect(await screen.findByText('Nada lançado neste mês')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para Despesas' })).toHaveAttribute('href', '/despesas')
    expect(screen.getByRole('link', { name: 'Ir para Receitas' })).toHaveAttribute('href', '/receitas')
  })

  it('saldo negativo com destaque de alerta', async () => {
    await renderSummary('/', {
      items: [{ source: 'Recurrence', sourceId: 4, direction: 'Expense', name: 'Internet', category: INTERNET, month, amount: 120 }],
    })
    const forecast = await screen.findByRole('region', { name: 'Previsto' })
    expect(within(forecast).getByText(/^-R\$\s120,00$/)).toHaveClass('text-destructive')
  })

  it('falha ao carregar mostra "Tentar novamente"', async () => {
    const [y, m] = month.split('-').map(Number)
    let fail = true
    const { store } = await renderSummary('/', {
      items,
      routes: {
        [`GET /summaries?year=${y}&month=${m}`]: (init, key) =>
          fail ? { status: 400, body: { errors: ['Erro ao carregar.'] } } : (store.routes['*'] as (i: RequestInit, k: string) => never)(init, key),
      },
    })
    expect(await screen.findByText('Erro ao carregar.')).toBeInTheDocument()
    fail = false
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('region', { name: 'Previsto' })).toBeInTheDocument()
  })
})

describe('Saldo acumulado (US2)', () => {
  it('destaque "Saldo no fim do mês" com o que veio do mês anterior e projeção', async () => {
    await renderSummary('/', { items, openingBalance: { amount: 1000, month } })

    const hero = await screen.findByRole('region', { name: 'Saldo no fim do mês' })
    expect(within(hero).getByTestId('hero-value')).toHaveTextContent(money(3380))
    expect(text(hero)).toContain(`veio de ${formatMonth(prev)} ${money(1000)}`)
    expect(text(hero)).toContain(`saldo do mês ${money(2380)}`)
    expect(text(hero)).toContain('Projeção de fechamento')
  })

  it('mês encerrado usa o realizado', async () => {
    await renderSummary(`/?mes=${prev}`, { openingBalance: { amount: 500, month: prev } })
    const hero = await screen.findByRole('region', { name: 'Saldo no fim do mês' })
    expect(text(hero)).toContain('Fechamento realizado')
  })

  it('sem saldo inicial: saldo previsto e link para Configurações', async () => {
    await renderSummary('/', { items })
    const hero = await screen.findByRole('region', { name: 'Saldo previsto do mês' })
    expect(within(hero).getByTestId('hero-value')).toHaveTextContent(money(2380))
    expect(within(hero).getByRole('link', { name: 'Informar saldo inicial' })).toHaveAttribute('href', '/configuracoes')
  })

  it('com filtro e antes do saldo inicial explica a falta do acumulado', async () => {
    await renderSummary(`/?categoria=${CASA.id}`, { items, openingBalance: { amount: 1000, month } })
    expect(await screen.findByText(/vale só para a família inteira/)).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Todas')
    await screen.findByRole('region', { name: 'Saldo no fim do mês' })
    await userEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(await screen.findByText(/começa no mês do saldo inicial/)).toBeInTheDocument()
  })
})

describe('Pendências de meses anteriores (US3)', () => {
  const pendingItems: SeedLedgerItem[] = [
    ...items,
    { source: 'Recurrence', sourceId: 4, direction: 'Expense', name: 'Internet', category: INTERNET, month: prev, date: `${prev}-12`, amount: 120 },
    { source: 'Income', sourceId: 9, direction: 'Income', name: '13º de outubro', category: DECIMO, month: prev, date: `${prev}-20`, amount: 500 },
    { source: 'Reimbursement', sourceId: 2, direction: 'Income', name: 'Reembolso — Esposa', month: prev, date: `${prev}-01`, amount: 60 },
  ]

  it('o destaque mostra as pendências que entram no saldo do fim do mês', async () => {
    await renderSummary('/', { items: pendingItems, openingBalance: { amount: 1000, month: prev } })
    const hero = await screen.findByRole('region', { name: 'Saldo no fim do mês' })
    expect(text(hero)).toContain(`pendências de meses anteriores ${money(440)}`)
  })

  it('mostra totais e itens e resolve uma conta fixa com um toque', async () => {
    const { calls, store } = await renderSummary('/', { items: pendingItems, openingBalance: { amount: 1000, month: prev } })

    const section = await screen.findByRole('region', { name: 'Pendências de meses anteriores' })
    expect(text(section)).toContain(`A pagar ${money(120)}`)
    expect(text(section)).toContain(`A receber ${money(560)}`)
    const list = within(section).getByRole('list', { name: 'Pendências de meses anteriores' })
    expect(text(list)).toContain(`Internet · ${formatMonth(prev)}`)

    const [y, m] = prev.split('-').map(Number)
    await userEvent.click(within(list).getByRole('checkbox', { name: 'Em aberto: Internet' }))
    expect(await screen.findByText('Marcado como pago.')).toBeInTheDocument()
    expect(calls.some((call) => call.key === `POST /recurrences/4/months/${y}/${m}/settlement`)).toBe(true)
    expect(store.items.find((i) => i.sourceId === 4 && i.month === prev)!.isSettled).toBe(true)
    await waitFor(() => expect(text(screen.getByRole('region', { name: 'Pendências de meses anteriores' }))).toContain(`A pagar ${money(0)}`))
  })

  it('receita pendente recebida pelo resumo; reembolso só leitura com link para a pessoa', async () => {
    const { calls } = await renderSummary('/', { items: pendingItems, openingBalance: { amount: 1000, month: prev } })
    const list = await screen.findByRole('list', { name: 'Pendências de meses anteriores' })

    await userEvent.click(within(list).getByRole('checkbox', { name: 'A receber: 13º de outubro' }))
    expect(await screen.findByText('Marcado como recebido.')).toBeInTheDocument()
    expect(calls.some((call) => call.key === 'POST /incomes/9/receipt')).toBe(true)

    const refundRow = within(list).getByRole('link', { name: 'Abrir Reembolso — Esposa' }).closest('li')!
    expect(within(refundRow).queryByRole('checkbox')).not.toBeInTheDocument()
    await userEvent.click(within(refundRow).getByRole('link', { name: 'Abrir Reembolso — Esposa' }))
    await waitFor(() => expect(currentLocation()).toBe(`/pessoas/2?mes=${prev}`))
  })

  it('sem pendências ou fora do mês atual a seção não aparece', async () => {
    await renderSummary(`/?mes=${prev}`, { items: pendingItems, openingBalance: { amount: 1000, month: prev } })
    await screen.findByRole('region', { name: 'Previsto' })
    expect(screen.queryByRole('region', { name: 'Pendências de meses anteriores' })).not.toBeInTheDocument()
  })
})

describe('Itens do mês (US4)', () => {
  it('abas com aba no endereço; itens com categoria, n/total, parcial e links', async () => {
    await renderSummary('/', { items })

    const incomes = await screen.findByRole('list', { name: 'Entradas' })
    const rows = within(incomes).getAllByRole('listitem')
    expect(text(rows[0])).toContain('Salário')
    expect(text(rows[1])).toContain('13º salário')
    expect(within(incomes).getByRole('link', { name: 'Abrir Salário' })).toHaveAttribute('href', '/receitas?recorrencia=1')
    expect(within(incomes).getByRole('link', { name: 'Abrir 13º salário' })).toHaveAttribute('href', '/receitas?receita=2')

    await userEvent.click(screen.getByRole('tab', { name: 'Saídas' }))
    expect(currentLocation()).toBe('/?lista=saidas')
    const expenses = await screen.findByRole('list', { name: 'Saídas' })
    expect(within(expenses).getByRole('link', { name: 'Abrir Geladeira · 3/10' })).toHaveAttribute('href', '/despesas?despesa=7')
    expect(within(expenses).getByRole('link', { name: 'Abrir Internet' })).toHaveAttribute('href', '/contas-fixas?recorrencia=4')
    expect(text(within(expenses).getByRole('link', { name: 'Abrir Aluguel' }))).toContain(`${money(4520)}de ${money(5650)}`)
  })

  it('filtro por categoria filtra listas e totais e fica no endereço', async () => {
    await renderSummary('/', { items })
    await screen.findByRole('list', { name: 'Entradas' })

    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Casa')
    expect(currentLocation()).toBe(`/?categoria=${CASA.id}`)
    await waitFor(() => expect(text(screen.getByRole('region', { name: 'Previsto' }))).toContain(`Saídas${money(6000)}`))
    await userEvent.click(screen.getByRole('tab', { name: 'Saídas' }))
    expect(within(await screen.findByRole('list', { name: 'Saídas' })).getAllByRole('listitem')).toHaveLength(2)
  })

  it('caixa marca e desmarca receita e parcela nas listas', async () => {
    const { calls } = await renderSummary('/', { items })

    await userEvent.click(await screen.findByRole('checkbox', { name: 'A receber: 13º salário' }))
    expect(await screen.findByText('Marcado como recebido.')).toBeInTheDocument()
    await waitFor(() => expect(text(screen.getByRole('region', { name: 'Realizado' }))).toContain(`Recebido${money(8500)}`))

    await userEvent.click(screen.getByRole('checkbox', { name: 'Recebida: 13º salário' }))
    expect(await screen.findByText('Recebimento desfeito.')).toBeInTheDocument()
    expect(calls.some((call) => call.key === 'DELETE /incomes/2/receipt')).toBe(true)

    await userEvent.click(screen.getByRole('tab', { name: 'Saídas' }))
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Paga: Geladeira · 3/10' }))
    expect(await screen.findByText('Pagamento desfeito.')).toBeInTheDocument()
    expect(calls.some((call) => call.key === 'DELETE /expenses/7/installments/3/payment')).toBe(true)
  })
})
