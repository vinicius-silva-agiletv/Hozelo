import { render } from '@testing-library/react'
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

/** O app inteiro (rotas, guardas e layouts) a partir de `path`. */
export function renderApp(path = '/') {
  return renderWithProviders(<App />, { path })
}

export const currentLocation = () => document.querySelector('[data-testid="location"]')?.textContent ?? ''
