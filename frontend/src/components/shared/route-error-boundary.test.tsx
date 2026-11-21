import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { lazy } from 'react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RouteBoundary, RouteErrorBoundary } from './route-error-boundary'

afterEach(() => vi.restoreAllMocks())

describe('Carregamento sob demanda (US5)', () => {
  it('mostra o indicador enquanto a tela é baixada e depois a tela', async () => {
    let finish: () => void = () => {}
    const Screen = lazy(
      () =>
        new Promise<{ default: () => React.JSX.Element }>((resolve) => {
          finish = () => resolve({ default: () => <h1>Configurações</h1> })
        }),
    )

    render(
      <MemoryRouter>
        <RouteBoundary>
          <Screen />
        </RouteBoundary>
      </MemoryRouter>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...')
    finish()
    expect(await screen.findByRole('heading', { name: 'Configurações' })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('falha ao baixar a tela mostra a mensagem e "Tentar de novo"', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const Broken = lazy(() => Promise.reject(new Error('Failed to fetch dynamically imported module')))

    render(
      <MemoryRouter>
        <RouteBoundary>
          <Broken />
        </RouteBoundary>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Não foi possível carregar esta tela.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })

  it('"Tentar de novo" executa a nova tentativa', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const retry = vi.fn()
    const Throws = () => {
      throw new Error('falhou')
    }

    render(
      <RouteErrorBoundary onRetry={retry}>
        <Throws />
      </RouteErrorBoundary>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
