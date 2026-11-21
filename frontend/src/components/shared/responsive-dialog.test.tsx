import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Button } from '@/components/ui/button'
import { mockViewport } from '@/test/media'

import { ResponsiveDialog, ResponsiveDialogFooter } from './responsive-dialog'

afterEach(() => vi.restoreAllMocks())

function Example() {
  return (
    <ResponsiveDialog open onOpenChange={() => {}} title="Nova categoria" description="Descrição">
      <p>Conteúdo</p>
      <ResponsiveDialogFooter>
        <Button>Salvar</Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}

describe('ResponsiveDialog', () => {
  it('abre como diálogo centralizado no computador', () => {
    mockViewport(1280)
    render(<Example />)

    const dialog = screen.getByRole('dialog', { name: 'Nova categoria' })
    expect(dialog).toHaveAttribute('data-slot', 'dialog-content')
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
  })

  it('abre como painel vindo de baixo no celular', () => {
    mockViewport(360)
    render(<Example />)

    const dialog = screen.getByRole('dialog', { name: 'Nova categoria' })
    expect(dialog).toHaveAttribute('data-slot', 'sheet-content')
    expect(dialog).toHaveAttribute('data-side', 'bottom')
  })
})
