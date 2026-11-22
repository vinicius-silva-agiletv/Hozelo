import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { addMonthsToDate, todayIso } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import { addMonths, currentMonth, formatMonth } from '@/lib/month'
import { CASA, MORADIA, renderExpenses, TRANSPORTE } from '@/test/expenses-setup'
import { currentLocation } from '@/test/render'

const month = currentMonth()
const next = addMonths(month, 1)

const seed = [
  { name: 'Aluguel', categoryId: MORADIA, amount: 1200, firstDueDate: `${month}-05`, alreadyPaidInstallments: 1 },
  { name: 'Geladeira', categoryId: CASA, amount: 3500, installmentsCount: 10, firstDueDate: `${month}-10` },
  {
    name: 'Carro',
    categoryId: TRANSPORTE,
    amount: 1000,
    amountType: 'Installment' as const,
    installmentsCount: 48,
    firstDueDate: addMonthsToDate(`${month}-15`, -42),
    alreadyPaidInstallments: 42,
  },
]

const rows = () => within(screen.getByRole('list', { name: /^Parcelas de/ })).getAllByRole('listitem')
function totalsText() {
  return screen.getByLabelText('Totais do mês').textContent
}

describe('Despesas - visão do mês (US1)', () => {
  it('lista as parcelas do mês em ordem com os totais da API', async () => {
    await renderExpenses('/despesas', { expenses: seed })

    expect(await screen.findByRole('heading', { level: 1, name: 'Despesas' })).toBeInTheDocument()
    expect(document.title).toBe('Despesas · Hozelo')
    expect(await screen.findByRole('list', { name: `Parcelas de ${formatMonth(month)}` })).toBeInTheDocument()

    const items = rows()
    expect(items.map((item) => within(item).getByRole('button', { name: /^Abrir/ }).textContent)).toEqual([
      expect.stringContaining('Aluguel'),
      expect.stringContaining('Geladeira'),
      expect.stringContaining('Carro'),
    ])
    expect(items[1]).toHaveTextContent('Casa')
    expect(items[1]).toHaveTextContent('1/10')
    expect(items[1]).toHaveTextContent(formatCurrency(350).replace(/\s/g, ' '))
    expect(items[2]).toHaveTextContent('43/48')
    expect(within(items[0]).getByRole('checkbox')).toBeChecked()

    const text = totalsText()!.replace(/\s/g, ' ')
    expect(text).toContain(`Total${formatCurrency(2550)}`.replace(/\s/g, ' '))
    expect(text).toContain(`Pago${formatCurrency(1200)}`.replace(/\s/g, ' '))
    expect(text).toContain(`Em aberto${formatCurrency(1350)}`.replace(/\s/g, ' '))
  })

  it('troca o mês, mantém no endereço e filtra por categoria', async () => {
    await renderExpenses('/despesas', { expenses: seed })
    await screen.findByRole('list', { name: `Parcelas de ${formatMonth(month)}` })

    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(await screen.findByRole('list', { name: `Parcelas de ${formatMonth(next)}` })).toBeInTheDocument()
    expect(currentLocation()).toContain(`mes=${next}`)
    expect(rows()).toHaveLength(2)
    expect(rows()[0]).toHaveTextContent('2/10')

    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Casa')
    expect(currentLocation()).toContain(`categoria=${CASA}`)
    await screen.findByText((_, element) => element?.tagName === 'DL' && element.textContent?.includes(`Total${formatCurrency(350)}`) === true)
    expect(rows()).toHaveLength(1)
  })

  it('parcela antecipada aparece no mês do pagamento com o valor pago', async () => {
    const { store } = await renderExpenses('/despesas?mes=2030-01', { expenses: seed })
    const fridge = store.items.find((e) => e.name === 'Geladeira')!
    Object.assign(fridge.installments[2], { isPaid: true, paidOn: todayIso(), paidAmount: 300, prepaid: true })

    await userEvent.click(await screen.findByRole('button', { name: 'Mês atual' }))
    const item = (await screen.findAllByRole('listitem')).find((li) => li.textContent?.includes('3/10'))!
    expect(item).toHaveTextContent('antecipada')
    expect(item).toHaveTextContent(formatCurrency(300).replace(/\s/g, ' '))

    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    await screen.findByRole('list', { name: `Parcelas de ${formatMonth(addMonths(month, 2))}` })
    expect(rows().some((li) => li.textContent?.includes('3/10'))).toBe(false)
  })

  it('mês sem parcelas mostra estado vazio com "Nova despesa"', async () => {
    await renderExpenses('/despesas?mes=2030-01', { expenses: seed })
    expect(await screen.findByText('Nenhuma parcela neste mês')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Nova despesa' }).length).toBeGreaterThanOrEqual(2)
  })

  it('categoria inexistente no endereço volta para "Todas"', async () => {
    await renderExpenses('/despesas?categoria=999', { expenses: seed })
    await screen.findByRole('list', { name: `Parcelas de ${formatMonth(month)}` })
    expect(screen.getByLabelText('Categoria')).toHaveValue('')
    expect(rows()).toHaveLength(3)
  })

  it('falha ao carregar mostra "Tentar novamente"', async () => {
    const [y, m] = month.split('-').map(Number)
    let fail = true
    await renderExpenses('/despesas', {
      routes: {
        [`GET /installments?year=${y}&month=${m}`]: () =>
          fail
            ? { status: 400, body: { errors: ['Erro ao carregar.'] } }
            : { status: 200, body: { year: y, month: m, totalAmount: 0, paidAmount: 0, openAmount: 0, installments: [] } },
      },
    })
    expect(await screen.findByText('Erro ao carregar.')).toBeInTheDocument()
    fail = false
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Nenhuma parcela neste mês')).toBeInTheDocument()
  })
})
