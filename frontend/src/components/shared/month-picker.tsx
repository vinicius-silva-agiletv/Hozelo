import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { addMonths, currentMonth, formatMonth, isWithinRange, MAX_MONTH, MIN_MONTH } from '@/lib/month'
import { cn } from '@/lib/utils'

interface MonthPickerProps {
  /** "yyyy-MM" */
  value: string
  onChange: (month: string) => void
  /** Nome acessível do grupo (quando há mais de um seletor na tela). */
  label?: string
}

const SHORT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MIN_YEAR = Number(MIN_MONTH.slice(0, 4))
const MAX_YEAR = Number(MAX_MONTH.slice(0, 4))

/**
 * Navega de mês em mês (2000-01 a 2100-12), com atalho para o mês atual e escolha direta: tocar no
 * nome do mês abre a grade de meses do ano.
 */
export function MonthPicker({ value, onChange, label = 'Seletor de mês' }: MonthPickerProps) {
  const today = currentMonth()
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(() => Number(value.slice(0, 4)))

  const choose = (month: string) => {
    onChange(month)
    setOpen(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label={label}>
      <Button type="button"
        variant="outline"
        size="icon"
        aria-label="Mês anterior"
        disabled={value <= MIN_MONTH}
        onClick={() => onChange(addMonths(value, -1))}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) setYear(Number(value.slice(0, 4)))
          setOpen(next)
        }}
      >
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" className="min-w-40 font-medium first-letter:uppercase" aria-live="polite" aria-haspopup="dialog">
            {formatMonth(value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" aria-label="Escolher mês">
          <div className="mb-2 flex items-center justify-between">
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Ano anterior" disabled={year <= MIN_YEAR} onClick={() => setYear(year - 1)}>
              <ChevronLeft aria-hidden />
            </Button>
            <span className="font-medium tabular-nums">{year}</span>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Próximo ano" disabled={year >= MAX_YEAR} onClick={() => setYear(year + 1)}>
              <ChevronRight aria-hidden />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {SHORT_MONTHS.map((label, index) => {
              const month = `${year}-${String(index + 1).padStart(2, '0')}`
              const selected = month === value
              return (
                <Button type="button"
                  key={label}
                  variant={selected ? 'default' : 'ghost'}
                  size="sm"
                  aria-label={formatMonth(month)}
                  aria-pressed={selected}
                  disabled={!isWithinRange(month)}
                  className={cn(month === today && !selected && 'ring-1 ring-ring/40')}
                  onClick={() => choose(month)}
                >
                  {label}
                </Button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
      <Button type="button"
        variant="outline"
        size="icon"
        aria-label="Próximo mês"
        disabled={value >= MAX_MONTH}
        onClick={() => onChange(addMonths(value, 1))}
      >
        <ChevronRight aria-hidden />
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={value === today} onClick={() => onChange(today)}>
        Mês atual
      </Button>
    </div>
  )
}
