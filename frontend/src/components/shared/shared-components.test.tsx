import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Receipt } from 'lucide-react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '@/components/ui/button'
import { addMonths, currentMonth } from '@/lib/month'

import { ConfirmDialog } from './confirm-dialog'
import { EmptyState } from './empty-state'
import { MoneyInput } from './money-input'
import { MonthPicker } from './month-picker'
import { PageHeader } from './page-header'

const normalize = (text: string | null) => (text ?? '').replace(/\s/g, ' ')

function MoneyHarness({ onValue }: { onValue: (v: number) => void }) {
  const [value, setValue] = useState(0)
  return (
    <>
      <label htmlFor="amount">Valor</label>
      <MoneyInput id="amount" value={value} onChange={(v) => { setValue(v); onValue(v) }} />
    </>
  )
}

describe('MoneyInput', () => {
  it('dígitos entram pelos centavos e Backspace remove o último', async () => {
    const onValue = vi.fn()
    render(<MoneyHarness onValue={onValue} />)
    const input = screen.getByLabelText('Valor')
    expect(input).toHaveAttribute('inputmode', 'numeric')
    expect(normalize((input as HTMLInputElement).value)).toBe('R$ 0,00')

    await userEvent.type(input, '125050')
    expect(normalize((input as HTMLInputElement).value)).toBe('R$ 1.250,50')
    expect(onValue).toHaveBeenLastCalledWith(1250.5)

    await userEvent.type(input, '{Backspace}')
    expect(normalize((input as HTMLInputElement).value)).toBe('R$ 125,05')

    await userEvent.type(input, 'abc')
    expect(normalize((input as HTMLInputElement).value)).toBe('R$ 125,05')
  })

  it('colar converte o valor', async () => {
    const onValue = vi.fn()
    render(<MoneyHarness onValue={onValue} />)
    const input = screen.getByLabelText('Valor')

    await userEvent.click(input)
    await userEvent.paste('1250.5')
    expect(normalize((input as HTMLInputElement).value)).toBe('R$ 1.250,50')
  })
})

describe('MonthPicker', () => {
  function Harness({ initial }: { initial: string }) {
    const [month, setMonth] = useState(initial)
    return <MonthPicker value={month} onChange={setMonth} />
  }

  it('avança, volta, vira o ano e volta ao mês atual', async () => {
    render(<Harness initial="2026-12" />)

    expect(screen.getByText('dezembro de 2026')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(screen.getByText('janeiro de 2027')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    await userEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(screen.getByText('novembro de 2026')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Mês atual' }))
    expect(screen.getByRole('button', { name: 'Mês atual' })).toBeDisabled()
    expect(addMonths(currentMonth(), 0)).toBe(currentMonth())
  })

  it('respeita os limites 2000-01 e 2100-12', () => {
    const { unmount } = render(<Harness initial="2000-01" />)
    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeDisabled()
    unmount()

    render(<Harness initial="2100-12" />)
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeDisabled()
  })
})

describe('PageHeader e EmptyState', () => {
  it('mostram título, descrição e ações', () => {
    render(
      <>
        <PageHeader title="Despesas" description="Contas da família." actions={<Button>Registrar</Button>} />
        <EmptyState icon={Receipt} title="Nenhuma despesa ainda" description="Registre a primeira." action={<Button>Registrar despesa</Button>} />
      </>,
    )

    expect(screen.getByRole('heading', { name: 'Despesas' })).toBeInTheDocument()
    expect(screen.getByText('Contas da família.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar' })).toBeInTheDocument()
    expect(screen.getByText('Nenhuma despesa ainda')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar despesa' })).toBeInTheDocument()
  })
})

describe('ConfirmDialog', () => {
  it('confirma sem fechar sozinho, cancela e bloqueia durante o processamento', async () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <ConfirmDialog open onOpenChange={onOpenChange} title="Remover despesa?" description="Esta ação não pode ser desfeita."
        confirmLabel="Remover" destructive onConfirm={onConfirm} />,
    )

    expect(screen.getByRole('alertdialog', { name: 'Remover despesa?' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remover' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)

    rerender(
      <ConfirmDialog open onOpenChange={onOpenChange} title="Remover despesa?" confirmLabel="Remover" destructive pending onConfirm={onConfirm} />,
    )
    expect(screen.getByRole('button', { name: 'Remover' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
