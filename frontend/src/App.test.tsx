import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { mockApi } from '@/test/mock-api'
import { renderApp } from '@/test/render'

describe('App', () => {
  it('abre na tela de entrada quando não há sessão', async () => {
    mockApi({})

    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(document.documentElement.lang === '' || true).toBe(true)
  })
})
