import { useLayoutEffect, useRef, type ComponentProps } from 'react'

import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/format'
import { centsFromDigits, fromCents, MAX_CENTS, parseAmountToCents, toCents } from '@/lib/money'

type MoneyInputProps = Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type' | 'inputMode'> & {
  value: number | null | undefined
  onChange: (value: number) => void
}

/**
 * Campo de valor em reais no estilo app de banco (research.md §11): só dígitos, que entram pelos
 * centavos (1 → R$ 0,01 → 12 → R$ 0,12 ...); apagar remove o último dígito; colar converte o valor.
 */
export function MoneyInput({ value, onChange, ...props }: MoneyInputProps) {
  const ref = useRef<HTMLInputElement>(null)
  const cents = toCents(value ?? 0)
  const display = formatCurrency(fromCents(cents))

  // Cursor sempre no fim: os dígitos entram pela direita.
  useLayoutEffect(() => {
    const input = ref.current
    if (input && document.activeElement === input) input.setSelectionRange(display.length, display.length)
  }, [display])

  const emit = (next: number) => {
    if (next <= MAX_CENTS) onChange(fromCents(next))
  }

  return (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={display}
      onChange={(event) => emit(centsFromDigits(event.target.value))}
      onPaste={(event) => {
        event.preventDefault()
        const pasted = parseAmountToCents(event.clipboardData.getData('text'))
        if (pasted !== null) emit(pasted)
      }}
    />
  )
}
