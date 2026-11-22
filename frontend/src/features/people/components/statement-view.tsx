import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { MonthPicker } from '@/components/shared/month-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessages } from '@/lib/api'
import { formatBalance, formatCurrency, formatDate } from '@/lib/format'
import { addMonths, formatMonth } from '@/lib/month'
import { cn } from '@/lib/utils'
import type { ResponsePersonChargeItem, ResponsePersonPayment, ResponsePersonStatement } from '@/types/api'

import { chargeLabel, originLabel, originLink, statusLabel } from './charge-labels'

interface StatementViewProps {
  month: string
  statement: { data?: ResponsePersonStatement; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown }
  onMonthChange: (month: string) => void
  onEditCharge: (charge: ResponsePersonChargeItem) => void
  onDeleteCharge: (charge: ResponsePersonChargeItem) => void
  onEditPayment: (payment: ResponsePersonPayment) => void
  onDeletePayment: (payment: ResponsePersonPayment) => void
}

/** Extrato do mês da pessoa (US2, FR-004): valores e situações da API. */
export function StatementView({ month, statement, onMonthChange, onEditCharge, onDeleteCharge, onEditPayment, onDeletePayment }: StatementViewProps) {
  let content
  if (statement.isPending) {
    content = <Skeleton className="h-48 w-full" aria-label="Carregando extrato" />
  } else if (statement.isError || !statement.data) {
    content = (
      <ApiErrorAlert messages={errorMessages(statement.error)}>
        <Button variant="outline" size="sm" onClick={() => statement.refetch()}>Tentar novamente</Button>
      </ApiErrorAlert>
    )
  } else {
    const data = statement.data
    const empty = data.charges.length === 0 && data.payments.length === 0
    content = (
      <div className="space-y-4" aria-label={`Extrato de ${formatMonth(month)}`}>
        <Line label="Saldo anterior" value={formatBalance(data.previousBalance)} />

        <section aria-labelledby="charges-title" className="space-y-1.5">
          <h3 id="charges-title" className="text-sm font-medium">Cobranças do mês</h3>
          {data.charges.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma cobrança neste mês.</p>
          ) : (
            <ul aria-label="Cobranças do mês" className="divide-y rounded-xl border">
              {data.charges.map((charge) => (
                <ChargeRow key={charge.key} charge={charge} onEdit={() => onEditCharge(charge)} onDelete={() => onDeleteCharge(charge)} />
              ))}
            </ul>
          )}
        </section>

        <Line label="Total devido" value={formatBalance(data.totalDue)} strong />

        <section aria-labelledby="payments-title" className="space-y-1.5">
          <h3 id="payments-title" className="text-sm font-medium">Pagamentos do mês</h3>
          {data.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pagamento neste mês.</p>
          ) : (
            <ul aria-label="Pagamentos do mês" className="divide-y rounded-xl border">
              {data.payments.map((payment) => (
                <li key={payment.id} className="flex items-center gap-3 py-2 pr-1 pl-3 text-sm">
                  <span className="w-20 shrink-0 tabular-nums">{formatDate(payment.paidOn)}</span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{payment.notes ?? ''}</span>
                  <span className="shrink-0 font-medium tabular-nums">{formatCurrency(payment.amount)}</span>
                  <EntryMenu label={`pagamento de ${formatDate(payment.paidOn)}`} onEdit={() => onEditPayment(payment)} onDelete={() => onDeletePayment(payment)} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <Line label="Total pago" value={formatCurrency(data.totalPaid)} />
        <Line label={`Saldo final (passa para ${formatMonth(addMonths(month, 1))})`} value={formatBalance(data.endBalance)} strong />
        {empty && <p className="text-sm text-muted-foreground">Nada lançado neste mês.</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <MonthPicker value={month} onChange={onMonthChange} />
      {content}
    </div>
  )
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3 rounded-lg px-3 py-2', strong ? 'bg-muted/60 font-medium' : 'border')}>
      <span className="text-sm">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

function ChargeRow({ charge, onEdit, onDelete }: { charge: ResponsePersonChargeItem; onEdit: () => void; onDelete: () => void }) {
  const link = originLink(charge.originType, charge.originId)
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{chargeLabel(charge)}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{originLabel[charge.originType]}</span>
          <span>{formatDate(charge.date)}</span>
          <Badge variant={charge.status === 'Paid' ? 'secondary' : 'outline'}>{statusLabel(charge.status, charge.remaining)}</Badge>
        </span>
      </span>
      <span className={cn('shrink-0 font-medium tabular-nums', charge.status === 'Paid' && 'text-muted-foreground')}>{formatCurrency(charge.amount)}</span>
    </>
  )
  return (
    <li className="flex items-center gap-3 py-2 pr-1 pl-3 text-sm">
      {link ? (
        <Link to={link} className="flex min-w-0 flex-1 items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label={`Abrir ${chargeLabel(charge)}`}>
          {body}
        </Link>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-3">{body}</span>
      )}
      {charge.originType === 'Manual' ? (
        <EntryMenu label={charge.description} onEdit={onEdit} onDelete={onDelete} />
      ) : (
        <span className="size-9 shrink-0" aria-hidden />
      )}
    </li>
  )
}

function EntryMenu({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Ações de ${label}`}>
          <EllipsisVertical aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil aria-hidden />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 aria-hidden />
          Remover
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
