import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { formatCurrency } from '@/lib/format'
import { currentMonth } from '@/lib/month'
import { bodyOf, mockApi, storeSession, type Routes } from '@/test/mock-api'
import { renderWithProviders } from '@/test/render'
import type { ResponseOpeningBalance } from '@/types/api'

import { OpeningBalanceSection } from './opening-balance-section'

/** Saldo em memória: GET devolve 404 até ser informado; PUT grava. */
function balanceStore(initial: ResponseOpeningBalance | null = null): Routes {
  let current = initial
  return {
    'GET /opening-balance': () =>
      current ? { status: 200, body: current } : { status: 404, body: { errors: ['Saldo inicial não informado.'] } },
    'PUT /opening-balance': (init) => {
      current = bodyOf(init)
      return { status: 200, body: current }
    },
  }
}

function renderSection(routes: Routes) {
  storeSession()
  const api = mockApi(routes)
  renderWithProviders(<OpeningBalanceSection />)
  return api
}

describe('Saldo inicial (US3)', () => {
  it('não informado: aviso e ação para informar', async () => {
    renderSection(balanceStore())

    expect(await screen.findByText(/Saldo inicial ainda não informado/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Informar saldo inicial' })).toBeInTheDocument()
    expect(screen.getByText(/ponto de partida do saldo acumulado no resumo do mês/)).toBeInTheDocument()
  })

  it('informa com a data padrão no dia 1º do mês e mostra o valor salvo', async () => {
    const { calls } = renderSection(balanceStore())

    await userEvent.click(await screen.findByRole('button', { name: 'Informar saldo inicial' }))
    const dialog = await screen.findByRole('dialog', { name: 'Informar saldo inicial' })
    const date = within(dialog).getByLabelText('Data de referência')
    expect(date).toHaveValue(`${currentMonth()}-01`)
    expect(within(dialog).getByText('Use o saldo que vocês tinham no início do mês.')).toBeInTheDocument()

    await userEvent.type(within(dialog).getByLabelText('Valor'), '320000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Saldo inicial salvo.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(bodyOf(calls.find((call) => call.key === 'PUT /opening-balance')!.init)).toEqual({
      amount: 3200,
      referenceDate: `${currentMonth()}-01`,
    })
    expect(await screen.findByTestId('opening-balance-amount')).toHaveTextContent('R$ 3.200,00')
    const [year, month] = currentMonth().split('-')
    expect(screen.getByText(`em 01/${month}/${year}`)).toBeInTheDocument()
  })

  it('altera para saldo negativo e exibe com sinal e destaque', async () => {
    const { calls } = renderSection(balanceStore({ amount: 3200, referenceDate: '2026-11-01' }))

    expect(await screen.findByTestId('opening-balance-amount')).toHaveTextContent('R$ 3.200,00')
    await userEvent.click(screen.getByRole('button', { name: 'Alterar' }))
    const dialog = await screen.findByRole('dialog', { name: 'Alterar saldo inicial' })
    expect(within(dialog).getByLabelText('Valor')).toHaveValue(formatCurrency(3200))
    expect(within(dialog).getByLabelText('Data de referência')).toHaveValue('2026-11-01')

    const amount = within(dialog).getByLabelText('Valor')
    await userEvent.clear(amount)
    await userEvent.type(amount, '45000')
    await userEvent.click(within(dialog).getByRole('switch', { name: /Saldo negativo/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Saldo inicial salvo.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'PUT /opening-balance')!.init)).toEqual({ amount: -450, referenceDate: '2026-11-01' })
    const shown = await screen.findByTestId('opening-balance-amount')
    await waitFor(() => expect(shown).toHaveTextContent('−R$ 450,00'))
    expect(shown).toHaveClass('text-destructive')
  })

  it('ao alterar um saldo negativo, a chave já vem ligada', async () => {
    renderSection(balanceStore({ amount: -450, referenceDate: '2026-10-01' }))

    await userEvent.click(await screen.findByRole('button', { name: 'Alterar' }))
    const dialog = await screen.findByRole('dialog', { name: 'Alterar saldo inicial' })
    expect(within(dialog).getByRole('switch', { name: /Saldo negativo/ })).toBeChecked()
    expect(within(dialog).getByLabelText('Valor')).toHaveValue(formatCurrency(450))
  })

  it('recusa da API aparece no formulário', async () => {
    renderSection({
      ...balanceStore(),
      'PUT /opening-balance': { status: 400, body: { errors: ['O valor deve ter no máximo 2 casas decimais.'] } },
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Informar saldo inicial' }))
    const dialog = await screen.findByRole('dialog', { name: 'Informar saldo inicial' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(await within(dialog).findByText('O valor deve ter no máximo 2 casas decimais.')).toBeInTheDocument()
  })

  it('falha ao carregar mostra "Tentar novamente"', async () => {
    let fail = true
    renderSection({
      'GET /opening-balance': () =>
        fail ? { status: 400, body: { errors: ['Erro ao carregar.'] } } : { status: 200, body: { amount: 10, referenceDate: '2026-11-01' } },
    })

    expect(await screen.findByText('Erro ao carregar.')).toBeInTheDocument()
    fail = false
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByTestId('opening-balance-amount')).toHaveTextContent('R$ 10,00')
  })
})
