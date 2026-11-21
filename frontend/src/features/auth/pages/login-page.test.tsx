import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { fakeToken, mockApi } from '@/test/mock-api'
import { currentLocation, renderApp } from '@/test/render'

const profile = { 'GET /users': { status: 200, body: { name: 'Família Silva', email: 'familia@x.com' } } }
const loginOk = { status: 200, body: { name: 'Família Silva', tokens: { accessToken: fakeToken() } } }

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('E-mail'), email)
  await user.type(screen.getByLabelText('Senha'), password)
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
  return user
}

describe('Entrar', () => {
  it('valida os campos antes de enviar', async () => {
    const { calls } = mockApi({})
    renderApp('/entrar')

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Informe o e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('E-mail'), 'abc')
    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('senha errada mostra a mensagem da API e mantém o e-mail', async () => {
    mockApi({ 'POST /login': { status: 401, body: { errors: ['E-mail e/ou senha inválidos.'] } } })
    renderApp('/entrar')

    await fillAndSubmit('familia@x.com', 'errada123')

    expect(await screen.findByText('E-mail e/ou senha inválidos.')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveValue('familia@x.com')
    expect(currentLocation()).toBe('/entrar')
  })

  it('bloqueio por tentativas mostra a mensagem da API', async () => {
    mockApi({ 'POST /login': { status: 429, body: { errors: ['Muitas tentativas de login. Tente novamente em alguns minutos.'] } } })
    renderApp('/entrar')

    await fillAndSubmit('familia@x.com', 'senha1234')

    expect(await screen.findByText('Muitas tentativas de login. Tente novamente em alguns minutos.')).toBeInTheDocument()
  })

  it('entra, guarda a sessão persistente e volta para a área pedida', async () => {
    mockApi({ 'POST /login': loginOk, ...profile })
    renderApp('/entrar?voltar=%2Fdespesas')

    expect(screen.getByRole('checkbox', { name: 'Manter conectado' })).toBeChecked()
    await fillAndSubmit(' Familia@x.com ', 'senha1234')

    expect(await screen.findByRole('heading', { name: 'Despesas' })).toBeInTheDocument()
    expect(currentLocation()).toBe('/despesas')
    expect(localStorage.getItem('hozelo.session')).not.toBeNull()
    expect(screen.getAllByText('Família Silva').length).toBeGreaterThan(0)
  })

  it('"Manter conectado" desmarcado guarda a sessão só nesta aba', async () => {
    mockApi({ 'POST /login': loginOk, ...profile })
    renderApp('/entrar')

    const user = userEvent.setup()
    await user.click(screen.getByRole('checkbox', { name: 'Manter conectado' }))
    await fillAndSubmit('familia@x.com', 'senha1234')

    await waitFor(() => expect(sessionStorage.getItem('hozelo.session')).not.toBeNull())
    expect(localStorage.getItem('hozelo.session')).toBeNull()
  })

  it('falha de conexão mostra mensagem amigável', async () => {
    const { fetchMock } = mockApi({})
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    renderApp('/entrar')

    await fillAndSubmit('familia@x.com', 'senha1234')

    expect(await screen.findByText('Não foi possível conectar. Verifique sua conexão e tente novamente.')).toBeInTheDocument()
  })

  it('link para criar conta', async () => {
    mockApi({})
    renderApp('/entrar')

    await userEvent.click(screen.getByRole('link', { name: 'Criar conta' }))

    expect(await screen.findByRole('heading', { name: 'Criar conta' })).toBeInTheDocument()
    expect(document.title).toBe('Criar conta · Hozelo')
  })
})
