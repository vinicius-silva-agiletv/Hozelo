import { CalendarCheck, EllipsisVertical } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ResponseMonthlyInstallment } from '@/types/api'

import { installmentLabel } from '../labels'
import { PaymentToggle } from './payment-toggle'

interface InstallmentRowProps {
  item: ResponseMonthlyInstallment
  onOpen: () => void
  onPayOnDate: () => void
}

/** Parcela na visão do mês: caixa de pago, dados e marcas; tocar abre o detalhe da despesa. */
export function InstallmentRow({ item, onOpen, onPayOnDate }: InstallmentRowProps) {
  const label = installmentLabel(item)
  const date = item.paidInAdvance && item.paidOn ? item.paidOn : item.dueDate
  // Paga: mostra o valor efetivamente pago (amortizada pode ter desconto); em aberto, o da parcela.
  const shownAmount = item.isPaid && item.paidAmount !== null ? item.paidAmount : item.amount

  return (
    <li className="flex items-center gap-3 py-2 pr-1 pl-3">
      <PaymentToggle expenseId={item.expenseId} number={item.number} isPaid={item.isPaid} prepaid={item.prepaid} label={label} />
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={`Abrir ${item.expenseName}`}
      >
        <span className="w-11 shrink-0 text-sm text-muted-foreground tabular-nums">{formatDate(date).slice(0, 5)}</span>
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate font-medium', item.isPaid && 'text-muted-foreground')}>{item.expenseName}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>{item.category.name}</span>
            {item.installmentsCount > 1 && <span>{`${item.number}/${item.installmentsCount}`}</span>}
            {item.paidInAdvance && <Badge variant="secondary">antecipada</Badge>}
            {item.prepaid && <Badge variant="outline">amortizada</Badge>}
          </span>
        </span>
        <span className={cn('shrink-0 font-medium tabular-nums', item.isPaid && 'text-muted-foreground')}>
          {formatCurrency(shownAmount)}
        </span>
      </button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Ações de ${label}`} disabled={item.isPaid}>
            <EllipsisVertical aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onPayOnDate}>
            <CalendarCheck aria-hidden />
            Pagar em outra data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
