import { CalendarCheck, EllipsisVertical, HandCoins } from 'lucide-react'
import { useNavigate } from 'react-router'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { EmptyState } from '@/components/shared/empty-state'
import { PaymentToggle } from '@/components/shared/payment-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { OccurrenceMenu, OccurrenceToggle } from '@/features/recurrences/components/occurrence-controls'
import type { ValueDialogTarget } from '@/features/recurrences/components/settle-dialogs'
import { useRecurrenceDetails } from '@/features/recurrences/hooks'
import { occurrenceOf } from '@/features/recurrences/occurrence'
import { kindWords } from '@/features/recurrences/words'
import { useMonthlySummary } from '@/features/summary/hooks'
import { errorMessages } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/format'
import { fromCents, toCents } from '@/lib/money'
import { formatMonth } from '@/lib/month'
import { cn } from '@/lib/utils'
import type { ResponseLedgerItem } from '@/types/api'

import { useIncomeReceipt } from '../hooks'

interface IncomeMonthListProps {
  month: string
  categoryId: number | null
  onOpenIncome: (id: number) => void
  onOpenRecurrence: (id: number) => void
  onOpenDialog: (target: ValueDialogTarget) => void
  onCreate: () => void
}

/** Receitas do mês (US1, FR-001): avulsas, ocorrências e reembolsos, com os totais da API. */
export function IncomeMonthList({ month, categoryId, onOpenIncome, onOpenRecurrence, onOpenDialog, onCreate }: IncomeMonthListProps) {
  const summary = useMonthlySummary(month, categoryId)
  const recurrenceIds = [...new Set(summary.data?.incomes.filter((i) => i.source === 'Recurrence').map((i) => i.sourceId) ?? [])]
  const details = useRecurrenceDetails(recurrenceIds)

  if (summary.isPending) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Carregando receitas">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    )
  }
  if (summary.isError) {
    return (
      <ApiErrorAlert messages={errorMessages(summary.error)}>
        <Button variant="outline" size="sm" onClick={() => summary.refetch()}>Tentar novamente</Button>
      </ApiErrorAlert>
    )
  }

  const { incomes, forecast, realized } = summary.data
  // A receber = previsto − recebido, ambos da API (reembolsos parciais entram certos; SC-004).
  const toReceive = fromCents(Math.max(0, toCents(forecast.incomes) - toCents(realized.received)))

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-3 gap-2" aria-label="Totais do mês">
        {[
          ['Previsto', forecast.incomes],
          ['Recebido', realized.received],
          ['A receber', toReceive],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border px-2 py-2 sm:px-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-heading text-sm font-semibold tabular-nums break-words sm:text-lg">{formatCurrency(value as number)}</dd>
          </div>
        ))}
      </dl>

      {incomes.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="Nenhuma receita neste mês"
          description={categoryId ? 'Nada nesta categoria no mês escolhido.' : 'Cadastre o salário e as outras entradas da família.'}
          action={<Button onClick={onCreate}>Nova receita</Button>}
        />
      ) : (
        <ul aria-label={`Receitas de ${formatMonth(month)}`} className="divide-y rounded-xl border">
          {incomes.map((item) => (
            <li key={`${item.source}-${item.sourceId}`} className="flex items-center gap-3 py-2 pr-1 pl-3">
              {item.source === 'Income' && <IncomeRow item={item} onOpen={() => onOpenIncome(item.sourceId)} onOpenDialog={onOpenDialog} />}
              {item.source === 'Recurrence' && (
                <RecurrenceRow
                  item={item}
                  month={month}
                  occurrence={occurrenceOf(details.byId.get(item.sourceId), item, month)!}
                  onOpen={() => onOpenRecurrence(item.sourceId)}
                  onOpenDialog={onOpenDialog}
                />
              )}
              {item.source === 'Reimbursement' && <ReimbursementRow item={item} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RowBody({ item, onOpen, badge, ariaLabel }: { item: ResponseLedgerItem; onOpen: () => void; badge?: string; ariaLabel: string }) {
  const partial = item.isSettled && item.settledAmount !== null && item.settledAmount < item.amount
  const shown = formatCurrency(partial || (item.isSettled && item.settledAmount !== null) ? item.settledAmount! : item.amount)
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={ariaLabel}
      className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="w-11 shrink-0 text-sm text-muted-foreground tabular-nums">{formatDate(item.date).slice(0, 5)}</span>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate font-medium', item.isSettled && 'text-muted-foreground')}>{item.name}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {item.category && <span>{item.category.name}</span>}
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </span>
      </span>
      <span className={cn('shrink-0 text-right font-medium tabular-nums', item.isSettled && !partial && 'text-muted-foreground')}>
        {shown}
        {partial && <span className="block text-xs font-normal text-muted-foreground">{`de ${formatCurrency(item.amount)}`}</span>}
      </span>
    </button>
  )
}

function IncomeRow({ item, onOpen, onOpenDialog }: { item: ResponseLedgerItem; onOpen: () => void; onOpenDialog: (target: ValueDialogTarget) => void }) {
  const receipt = useIncomeReceipt(item.sourceId)
  const words = kindWords.Income
  return (
    <>
      <PaymentToggle
        isPaid={item.isSettled}
        label={item.name}
        states={{ on: words.done, off: words.open }}
        messages={{ paid: words.settledMsg, unpaid: words.undoneMsg }}
        onToggle={(received) => receipt.mutateAsync({ received })}
      />
      <RowBody item={item} onOpen={onOpen} ariaLabel={`Abrir ${item.name}`} />
      {item.isSettled ? (
        <span className="size-9 shrink-0" aria-hidden />
      ) : (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Ações de ${item.name}`}>
              <EllipsisVertical aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() =>
                onOpenDialog({
                  title: 'Receber em outra data',
                  description: item.name,
                  dateLabel: words.dateLabel,
                  confirmLabel: 'Receber',
                  successMessage: words.settledMsg,
                  onConfirm: ({ date }) => receipt.mutateAsync({ received: true, receivedOn: date }),
                })
              }
            >
              <CalendarCheck aria-hidden />
              Receber em outra data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  )
}

function RecurrenceRow({
  item,
  month,
  occurrence,
  onOpen,
  onOpenDialog,
}: {
  item: ResponseLedgerItem
  month: string
  occurrence: NonNullable<ReturnType<typeof occurrenceOf>>
  onOpen: () => void
  onOpenDialog: (target: ValueDialogTarget) => void
}) {
  const badge = occurrence.adjusted ? `recorrente · ajustado (normal ${formatCurrency(occurrence.normal)})` : 'recorrente'
  return (
    <>
      <OccurrenceToggle recurrenceId={item.sourceId} kind="Income" name={item.name} month={month} occurrence={occurrence} />
      <RowBody item={item} onOpen={onOpen} badge={badge} ariaLabel={`Abrir ${item.name}`} />
      <OccurrenceMenu recurrenceId={item.sourceId} kind="Income" name={item.name} month={month} occurrence={occurrence} onOpenDialog={onOpenDialog} />
    </>
  )
}

/** Reembolso de pessoa: só leitura; tocar leva à área Pessoas (clarify Q1). */
function ReimbursementRow({ item }: { item: ResponseLedgerItem }) {
  const navigate = useNavigate()
  return (
    <>
      <span className="size-5 shrink-0" aria-hidden />
      <RowBody item={item} onOpen={() => navigate('/pessoas')} badge="reembolso" ariaLabel={`Reembolso de ${item.name}, ver em Pessoas`} />
      <span className="size-9 shrink-0" aria-hidden />
    </>
  )
}
