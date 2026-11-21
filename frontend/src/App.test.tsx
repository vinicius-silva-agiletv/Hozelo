import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import App from '@/App'
import { renderWithProviders } from '@/test/render'

describe('App', () => {
  it('mostra a página inicial com os valores em reais', () => {
    renderWithProviders(<App />)

    expect(screen.getByRole('heading', { name: 'Hozelo' })).toBeInTheDocument()
    expect(screen.getByText('R$ 8.500,00')).toBeInTheDocument()
  })

  it('mostra um aviso ao clicar no botão', async () => {
    renderWithProviders(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Testar aviso' }))

    expect(await screen.findByText('Tudo pronto para começar as telas!')).toBeInTheDocument()
  })
})
