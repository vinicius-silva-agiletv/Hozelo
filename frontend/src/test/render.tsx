import { render, screen, waitFor } from '@testing-library/react'
import { expect } from 'vitest'
import type { ReactElement } from 'react'
import { MemoryRouter, useLocation } from 'react-router'

import App from '@/App'
import { Providers } from '@/app/providers'

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location" hidden>{`${location.pathname}${location.search}`}</output>
}

/** Renderiza com os providers do app num roteador em memória, começando em `path`. */
export function renderWithProviders(ui: ReactElement, { path = '/' }: { path?: string } = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Providers>
        {ui}
        <LocationProbe />
      </Providers>
    </MemoryRouter>,
  )
}

/**
 * O app inteiro (rotas, guardas e layouts) a partir de `path`. As telas são carregadas sob demanda,
 * então espera o indicador de carregamento sumir antes de devolver.
 */
export async function renderApp(path = '/') {
  const result = renderWithProviders(<App />, { path })
  // Primeira importação de uma tela pode levar mais que o padrão de 1 s com os testes em paralelo.
  await waitFor(() => expect(screen.queryByText('Carregando...')).not.toBeInTheDocument(), { timeout: 10000 })
  return result
}

export const currentLocation = () => document.querySelector('[data-testid="location"]')?.textContent ?? ''
