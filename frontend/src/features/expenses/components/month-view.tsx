import { Receipt } from 'lucide-react'
import { useState } from 'react'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { EmptyState } from '@/components/shared/empty-state'
import { MonthPicker } from '@/components/shared/month-picker'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessages } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import { formatMonth } from '@/lib/month'

import { useMonthlyInstallments } from '../hooks'
import { installmentLabel } from '../labels'
import { CategoryFilter } from './category-filter'
import { InstallmentRow } from './installment-row'
import { PayOnDateDialog, type PayTarget } from './pay-on-date-dialog'

interface MonthViewProps {
  month: string
  categoryId: number | null
  onMonthChange: (month: string) => void
  onCategoryChange: (categoryId: number | null) => void
  onOpenExpense: (id: number) => void
  onCreate: () => void
}

/** Visão do mês (US1, FR-001..FR-004): parcelas do mês, totais da API e marcação de pago. */
export function MonthView({ month, categoryId, onMonthChange, onCategoryChange, onOpenExpense, onCreate }: MonthViewProps) {
  const installments = useMonthlyInstallments(month, categoryId)
  const [payTarget, setPayTarget] = useState<PayTarget | null>(null)

  let content
  if (installments.isPending) {
    content = (
      <div className="space-y-2" aria-busy="true" aria-label="Carregando parcelas">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    )
  } else if (installments.isError) {
    content = (
      <ApiErrorAlert messages={errorMessages(installments.error)}>
        <Button variant="outline" size="sm" onClick={() => installments.refetch()}>Tentar novamente</Button>
      </ApiErrorAlert>
    )
  } else {
    const data = installments.data
    content = (
      <div className="space-y-4">
        <dl className="grid grid-cols-3 gap-2" aria-label="Totais do mês">
          {[
            ['Total', data.totalAmount],
            ['Pago', data.paidAmount],
            ['Em aberto', data.openAmount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border px-2 py-2 sm:px-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-heading text-sm font-semibold tabular-nums break-words sm:text-lg">{formatCurrency(value as number)}</dd>
            </div>
          ))}
        </dl>

        {data.installments.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Nenhuma parcela neste mês"
            description={categoryId ? 'Nada nesta categoria no mês escolhido.' : 'Cadastre as contas e compras da família.'}
            action={<Button onClick={onCreate}>Nova despesa</Button>}
          />
        ) : (
          <ul aria-label={`Parcelas de ${formatMonth(month)}`} className="divide-y rounded-xl border">
            {data.installments.map((item) => (
              <InstallmentRow
                key={`${item.expenseId}-${item.number}`}
                item={item}
                onOpen={() => onOpenExpense(item.expenseId)}
                onPayOnDate={() => setPayTarget({ expenseId: item.expenseId, number: item.number, label: installmentLabel(item) })}
              />
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthPicker value={month} onChange={onMonthChange} />
        <CategoryFilter id="month-category" value={categoryId} onChange={onCategoryChange} />
      </div>
      {content}
      <PayOnDateDialog target={payTarget} onClose={() => setPayTarget(null)} />
    </div>
  )
}
