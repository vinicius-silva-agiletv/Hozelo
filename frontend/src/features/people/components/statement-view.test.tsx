import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { formatCurrency } from '@/lib/format'
import { addMonths, currentMonth, formatMonth } from '@/lib/month'
import { renderPeople } from '@/test/people-setup'
import { currentLocation } from '@/test/render'

const month = currentMonth()
const prev = addMonths(month, -1)
const next = addMonths(month, 1)
const money = (value: number) => formatCurrency(value).replace(/\s/g, ' ')
const text = (element: HTMLElement) => element.textContent!.replace(/\s/g, ' ')

const seed = {
  people: ['Esposa'],
  charges: [
    { personId: 1, originType: 'Manual' as const, description: 'Mercado de outubro', date: `${prev}-20`, amount: 620 },
    { personId: 1, originType: 'Expense' as const, originId: 7, description: 'Fatura do cartão · 50%', number: 3, count: 10, date: `${month}-08`, amount: 350 },
    { personId: 1, originType: 'Recurrence' as const, originId: 4, description: 'Internet · 50%', date: `${month}-10`, amount: 60 },
  ],
  payments: [{ personId: 1, amount: 870, paidOn: `${month}-15`, notes: 'pix' }],
}

describe('Extrato do mês (US2)', () => {
  it('mostra saldo anterior, cobranças com situação, pagamentos e saldo final da API', async () => {
    await renderPeople('/pessoas/1', seed)

    expect(await screen.findByRole('heading', { level: 1, name: 'Esposa' })).toBeInTheDocument()
    expect(document.title).toBe('Esposa · Hozelo')
    const statement = await screen.findByLabelText(`Extrato de ${formatMonth(month)}`)
    expect(text(statement)).toContain(`Saldo anterior${money(620)}`)

    const charges = within(screen.getByRole('list', { name: 'Cobranças do mês' })).getAllByRole('listitem')
    expect(text(charges[0])).toContain('Fatura do cartão · 50% · 3/10')
    expect(text(charges[0])).toContain('despesa')
    // A cobrança mais antiga (mês anterior) é abatida primeiro: sobra R$ 250,00 para a fatura.
    expect(text(charges[0])).toContain(`parcial · falta ${money(100)}`)
    expect(text(charges[1])).toContain('conta fixa')
    expect(text(charges[1])).toContain('em aberto')

    expect(text(statement)).toContain(`Total devido${money(1030)}`)
    const payments = within(screen.getByRole('list', { name: 'Pagamentos do mês' })).getAllByRole('listitem')
    expect(text(payments[0])).toContain('pix')
    expect(text(payments[0])).toContain(money(870))
    expect(text(statement)).toContain(`Total pago${money(870)}`)
    expect(text(statement)).toContain(`Saldo final (passa para ${formatMonth(next)})${money(160)}`)
  })

  it('o saldo final passa para o mês seguinte e o mês fica no endereço', async () => {
    await renderPeople('/pessoas/1', seed)
    await screen.findByLabelText(`Extrato de ${formatMonth(month)}`)

    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    const statement = await screen.findByLabelText(`Extrato de ${formatMonth(next)}`)
    expect(currentLocation()).toBe(`/pessoas/1?mes=${next}`)
    expect(text(statement)).toContain(`Saldo anterior${money(160)}`)
    expect(text(statement)).toContain('Nada lançado neste mês.')
  })

  it('crédito aparece como "crédito de R$ X"', async () => {
    await renderPeople('/pessoas/1', { ...seed, payments: [{ personId: 1, amount: 1100, paidOn: `${month}-15` }] })
    const statement = await screen.findByLabelText(`Extrato de ${formatMonth(month)}`)
    expect(text(statement)).toContain(`crédito de ${money(70)}`)
  })

  it('cobrança de despesa e de conta fixa levam ao detalhe na tela delas', async () => {
    await renderPeople('/pessoas/1', seed)
    await userEvent.click(await screen.findByRole('link', { name: 'Abrir Fatura do cartão · 50% · 3/10' }))
    await waitFor(() => expect(currentLocation()).toBe('/despesas?despesa=7'))
  })

  it('cobranças automáticas não têm editar/remover; avulsas têm', async () => {
    await renderPeople(`/pessoas/1?mes=${prev}`, seed)
    await screen.findByLabelText(`Extrato de ${formatMonth(prev)}`)
    expect(screen.getByRole('button', { name: 'Ações de Mercado de outubro' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    await screen.findByLabelText(`Extrato de ${formatMonth(month)}`)
    expect(screen.queryByRole('button', { name: /Ações de Fatura/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ações de Internet/ })).not.toBeInTheDocument()
  })

  it('pessoa inexistente volta à lista com aviso', async () => {
    await renderPeople('/pessoas/99', seed)
    expect(await screen.findByText('Pessoa não encontrada.')).toBeInTheDocument()
    await waitFor(() => expect(currentLocation()).toBe('/pessoas'))
  })
})
