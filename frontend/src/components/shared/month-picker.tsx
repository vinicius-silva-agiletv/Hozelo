import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { addMonths, currentMonth, formatMonth, MAX_MONTH, MIN_MONTH } from '@/lib/month'

interface MonthPickerProps {
  /** "yyyy-MM" */
  value: string
  onChange: (month: string) => void
}

/** Navega de mês em mês (2000-01 a 2100-12), com atalho para o mês atual. */
export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const today = currentMonth()

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Seletor de mês">
      <Button
        variant="outline"
        size="icon"
        aria-label="Mês anterior"
        disabled={value <= MIN_MONTH}
        onClick={() => onChange(addMonths(value, -1))}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <span className="min-w-40 text-center font-medium first-letter:uppercase" aria-live="polite">
        {formatMonth(value)}
      </span>
      <Button
        variant="outline"
        size="icon"
        aria-label="Próximo mês"
        disabled={value >= MAX_MONTH}
        onClick={() => onChange(addMonths(value, 1))}
      >
        <ChevronRight aria-hidden />
      </Button>
      <Button variant="ghost" size="sm" disabled={value === today} onClick={() => onChange(today)}>
        Mês atual
      </Button>
    </div>
  )
}
