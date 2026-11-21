import { render } from '@testing-library/react'
import type { ReactElement } from 'react'

import { Providers } from '@/app/providers'

/** Renderiza com os mesmos providers do app (React Query, rotas, tooltips, avisos, tema). */
export function renderWithProviders(ui: ReactElement) {
  return render(<Providers>{ui}</Providers>)
}
