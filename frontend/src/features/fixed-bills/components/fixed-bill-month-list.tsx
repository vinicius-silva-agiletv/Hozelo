import { Repeat } from 'lucide-react'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { OccurrenceMenu, OccurrenceToggle } from '@/features/recurrences/components/occurrence-controls'
import type { ValueDialogTarget } from '@/features/recurrences/components/settle-dialogs'
import { useRecurrenceDetails, useRecurrences } from '@/features/recurrences/hooks'
import { fixedBillTotals, isActiveIn, occurrenceOf, type Occurrence } from '@/features/recurrences/occurrence'
import { useMonthlySummary } from '@/features/summary/hooks'
import { errorMessages } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import { formatMonth } from '@/lib/month'
import { cn } from '@/lib/utils'
import type { ResponseShortRecurrence } from '@/types/api'

import { EndedFixedBills } from './ended-fixed-bills'

interface FixedBillMonthListProps {
  month: string
  onOpenRecurrence: (id: number) => void
  onOpenDialog: (target: ValueDialogTarget) => void
  onCreate: () => void
}

/**
 * Contas fixas do mês (US4, FR-006): recorrências de despesa ativas no mês, com o valor e a situação
 * do mês (resumo da API) e as marcas de pulada/ajustada (detalhe de cada recorrência; research.md §2).
 */
export function FixedBillMonthList({ month, onOpenRecurrence, onOpenDialog, onCreate }: FixedBillMonthListProps) {
  const recurrences = useRecurrences('Expense')
  const summary = useMonthlySummary(month)
  const active = (recurrences.data ?? []).filter((r) => isActiveIn(r, month)).sort((a, b) => a.dayOfMonth - b.dayOfMonth || a.name.localeCompare(b.name))
  const details = useRecurrenceDetails(active.map((r) => r.id))

  if (recurrences.isPending || summary.isPending || (details.isPending && active.length > 0)) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Carregando contas fixas">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    )
  }
  if (recurrences.isError || summary.isError) {
    const error = recurrences.error ?? summary.error
    return (
      <ApiErrorAlert messages={errorMessages(error)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void recurrences.refetch()
            void summary.refetch()
          }}
        >
          Tentar novamente
        </Button>
      </ApiErrorAlert>
    )
  }

  const items = new Map(summary.data.expenses.filter((i) => i.source === 'Recurrence').map((i) => [i.sourceId, i]))
  const rows = active
    .map((recurrence) => ({ recurrence, occurrence: occurrenceOf(details.byId.get(recurrence.id), items.get(recurrence.id), month) }))
    .filter((row): row is { recurrence: ResponseShortRecurrence; occurrence: Occurrence } => row.occurrence !== null)
  const totals = fixedBillTotals(rows.map((row) => row.occurrence))
  const ended = (recurrences.data ?? []).filter((r) => r.endMonth !== null && r.endMonth < month)

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-3 gap-2" aria-label="Totais do mês">
        {[
          ['Previsto', totals.forecast],
          ['Pago', totals.paid],
          ['A pagar', totals.open],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border px-2 py-2 sm:px-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-heading text-sm font-semibold tabular-nums break-words sm:text-lg">{formatCurrency(value as number)}</dd>
          </div>
        ))}
      </dl>

      {rows.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Nenhuma conta fixa neste mês"
          description="Cadastre internet, luz, água e as outras contas que se repetem."
          action={<Button onClick={onCreate}>Nova conta fixa</Button>}
        />
      ) : (
        <ul aria-label={`Contas fixas de ${formatMonth(month)}`} className="divide-y rounded-xl border">
          {rows.map(({ recurrence, occurrence }) => (
            <li key={recurrence.id} className="flex items-center gap-3 py-2 pr-1 pl-3">
              <OccurrenceToggle recurrenceId={recurrence.id} kind="Expense" name={recurrence.name} month={month} occurrence={occurrence} />
              <button
                type="button"
                onClick={() => onOpenRecurrence(recurrence.id)}
                aria-label={`Abrir ${recurrence.name}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="w-12 shrink-0 text-sm text-muted-foreground">{`dia ${recurrence.dayOfMonth}`}</span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate font-medium', occurrence.status !== 'open' && 'text-muted-foreground')}>{recurrence.name}</span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>{recurrence.category.name}</span>
                    {occurrence.status === 'skipped' && <Badge variant="outline">pulada</Badge>}
                    {occurrence.adjusted && <Badge variant="secondary">{`ajustado (normal ${formatCurrency(occurrence.normal)})`}</Badge>}
                    {recurrence.person && <span>{`${recurrence.person.name} · ${recurrence.personPercent ?? 100}%`}</span>}
                  </span>
                </span>
                <span className={cn('shrink-0 font-medium tabular-nums', occurrence.status !== 'open' && 'text-muted-foreground', occurrence.status === 'skipped' && 'line-through')}>
                  {formatCurrency(occurrence.status === 'settled' ? (occurrence.settledAmount ?? occurrence.amount) : occurrence.amount)}
                </span>
              </button>
              <OccurrenceMenu
                recurrenceId={recurrence.id}
                kind="Expense"
                name={recurrence.name}
                month={month}
                occurrence={occurrence}
                onOpenDialog={onOpenDialog}
              />
            </li>
          ))}
        </ul>
      )}

      <EndedFixedBills recurrences={ended} onOpen={onOpenRecurrence} />
    </div>
  )
}
