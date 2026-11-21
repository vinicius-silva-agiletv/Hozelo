import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { mockApi, storeSession } from '@/test/mock-api'
import { currentLocation, renderApp } from '@/test/render'

describe('sessão e guardas de rota', () => {
  it('sem sessão, uma área leva à entrada guardando o caminho', async () => {
    mockApi({})

    await renderApp('/despesas')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(currentLocation()).toBe('/entrar?voltar=%2Fdespesas')
  })

  it('com sessão, a área abre e as telas de acesso levam ao resumo', async () => {
    storeSession()
    mockApi({ 'GET /users': { status: 200, body: { name: 'Família Silva', email: 'f@x.com' } } })

    await renderApp('/entrar')

    expect(await screen.findByRole('heading', { name: 'Resumo do mês' })).toBeInTheDocument()
    expect(currentLocation()).toBe('/')
  })

  it('401 com sessão encerra a sessão e leva à entrada com aviso e caminho de volta', async () => {
    storeSession()
    mockApi({ 'GET /users': { status: 401, body: { errors: ['Sessão inválida ou expirada. Faça login novamente.'] } } })

    await renderApp('/pessoas')

    expect(await screen.findByText('Sua sessão expirou. Entre novamente.')).toBeInTheDocument()
    await waitFor(() => expect(currentLocation()).toBe('/entrar?expirada=1&voltar=%2Fpessoas'))
    expect(localStorage.getItem('hozelo.session')).toBeNull()
  })

  it('sessão com token vencido é descartada ao abrir', async () => {
    localStorage.setItem('hozelo.session', JSON.stringify({ accessToken: 'a.eyJleHAiOjF9.b', accountName: 'X' }))
    mockApi({})

    await renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })
})
