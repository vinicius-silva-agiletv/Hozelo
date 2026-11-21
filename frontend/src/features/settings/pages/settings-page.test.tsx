import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { categoriesStore } from '@/test/categories-store'
import { mockApi, storeSession } from '@/test/mock-api'
import { currentLocation, renderApp } from '@/test/render'

const routes = () => ({
  'GET /users': { status: 200, body: { name: 'Família Silva', email: 'familia@exemplo.com' } },
  'GET /opening-balance': { status: 404, body: { errors: ['Saldo inicial não informado.'] } },
  ...categoriesStore([{ name: 'Mercado', type: 'Expense', entriesCount: 2 }]).routes,
})

describe('Tela de Configurações', () => {
  it('mostra as três seções no lugar de "em construção"', async () => {
    storeSession()
    mockApi(routes())
    await renderApp('/configuracoes')

    expect(await screen.findByRole('heading', { level: 1, name: 'Configurações' })).toBeInTheDocument()
    expect(document.title).toBe('Configurações · Hozelo')
    expect(screen.queryByText('Em construção')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Categorias' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Saldo inicial' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Conta' })).toBeInTheDocument()
    expect(await screen.findByText('Mercado')).toBeInTheDocument()
  })

  it('Conta (US4): nome e e-mail somente leitura e Sair leva à entrada', async () => {
    storeSession()
    mockApi(routes())
    await renderApp('/configuracoes')

    const account = await screen.findByRole('region', { name: 'Conta' })
    expect(await within(account).findByText('familia@exemplo.com')).toBeInTheDocument()
    expect(within(account).getByText('Família Silva')).toBeInTheDocument()
    expect(within(account).queryByRole('textbox')).not.toBeInTheDocument()

    await userEvent.click(within(account).getByRole('button', { name: 'Sair' }))
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(currentLocation()).toBe('/entrar')
    expect(localStorage.getItem('hozelo.session')).toBeNull()
  })
})
