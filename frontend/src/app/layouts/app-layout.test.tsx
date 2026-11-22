import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { mockApi, storeSession } from '@/test/mock-api'
import { currentLocation, renderApp } from '@/test/render'

const profile = { 'GET /users': { status: 200, body: { name: 'Família Silva Souza', email: 'f@x.com' } } }

describe('navegação', () => {
  it('menu lateral com as seis áreas e destaque da atual', async () => {
    storeSession('Família')
    mockApi(profile)
    await renderApp('/receitas')

    const sidebar = screen.getByRole('navigation', { name: 'Menu principal' })
    const links = within(sidebar).getAllByRole('link')
    expect(links.map((l) => l.textContent)).toEqual(['Resumo do mês', 'Despesas', 'Receitas', 'Contas fixas', 'Pessoas', 'Configurações'])
    expect(within(sidebar).getByRole('link', { name: 'Receitas' })).toHaveAttribute('aria-current', 'page')

    await userEvent.click(within(sidebar).getByRole('link', { name: 'Resumo do mês' }))
    expect(await screen.findByRole('heading', { name: 'Resumo do mês' })).toBeInTheDocument()
    expect(document.title).toBe('Resumo do mês · Hozelo')
  })

  it('nome da conta vem do perfil', async () => {
    storeSession('Nome antigo')
    mockApi(profile)
    await renderApp('/')

    expect((await screen.findAllByText('Família Silva Souza'))[0]).toHaveAttribute('title', 'Família Silva Souza')
  })

  it('barra do rodapé com 4 áreas e "Mais" com o restante, a conta e Sair', async () => {
    storeSession('Família')
    mockApi(profile)
    await renderApp('/')

    const bottom = screen.getByRole('navigation', { name: 'Navegação inferior' })
    expect(within(bottom).getAllByRole('link').map((l) => l.textContent)).toEqual(['Resumo', 'Despesas', 'Receitas', 'Pessoas'])

    await userEvent.click(within(bottom).getByRole('button', { name: 'Mais' }))
    const sheet = await screen.findByRole('dialog', { name: 'Mais opções' })
    expect(within(sheet).getByRole('link', { name: 'Contas fixas' })).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: 'Sair' })).toBeInTheDocument()

    await userEvent.click(within(sheet).getByRole('link', { name: 'Configurações' }))
    expect(await screen.findByRole('heading', { name: 'Configurações' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Mais opções' })).not.toBeInTheDocument()
  })

  it('sair encerra a sessão e volta à entrada', async () => {
    storeSession('Família')
    mockApi(profile)
    await renderApp('/despesas')

    const sidebar = screen.getByRole('navigation', { name: 'Menu principal' }).closest('aside')!
    await userEvent.click(within(sidebar).getByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(currentLocation()).toBe('/entrar')
    expect(localStorage.getItem('hozelo.session')).toBeNull()
  })

  it('endereço inexistente mostra 404 com atalho para o início', async () => {
    mockApi({})
    await renderApp('/xyz')

    expect(screen.getByText('Página não encontrada')).toBeInTheDocument()
    expect(document.title).toBe('Página não encontrada · Hozelo')
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/')
  })
})
