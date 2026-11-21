import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { fakeToken, mockApi } from '@/test/mock-api'
import { currentLocation, renderApp } from '@/test/render'

async function fill(name: string, email: string, password: string) {
  const user = userEvent.setup()
  if (name) await user.type(screen.getByLabelText('Nome'), name)
  if (email) await user.type(screen.getByLabelText('E-mail'), email)
  if (password) await user.type(screen.getByLabelText('Senha'), password)
  await user.click(screen.getByRole('button', { name: 'Criar conta' }))
}

describe('Criar conta', () => {
  it('valida nome, e-mail e senha mínima', async () => {
    const { calls } = mockApi({})
    await renderApp('/cadastro')

    await fill('', 'x@y', '1234567')

    expect(await screen.findByText('Informe o nome.')).toBeInTheDocument()
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.getByText('A senha deve ter no mínimo 8 caracteres.')).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('cria a conta e entra no app', async () => {
    mockApi({
      'POST /users': { status: 201, body: { name: 'Família Silva', tokens: { accessToken: fakeToken() } } },
      'GET /users': { status: 200, body: { name: 'Família Silva', email: 'f@x.com' } },
    })
    await renderApp('/cadastro')

    await fill('Família Silva', 'f@x.com', 'senha1234')

    expect(await screen.findByRole('heading', { name: 'Resumo do mês' })).toBeInTheDocument()
    expect(currentLocation()).toBe('/')
    expect(localStorage.getItem('hozelo.session')).not.toBeNull()
  })

  it('conta existente mostra a mensagem e o atalho para a entrada', async () => {
    mockApi({ 'POST /users': { status: 409, body: { errors: ['Já existe uma conta cadastrada. Faça login para continuar.'] } } })
    await renderApp('/cadastro')

    await fill('Outra', 'o@x.com', 'senha1234')

    expect(await screen.findByText('Já existe uma conta cadastrada. Faça login para continuar.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Ir para a entrada' }))
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('mostra todas as mensagens de validação da API', async () => {
    mockApi({ 'POST /users': { status: 400, body: { errors: ['Mensagem A.', 'Mensagem B.'] } } })
    await renderApp('/cadastro')

    await fill('Família', 'f@x.com', 'senha1234')

    expect(await screen.findByText('Mensagem A.')).toBeInTheDocument()
    expect(screen.getByText('Mensagem B.')).toBeInTheDocument()
  })
})
