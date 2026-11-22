import { ListChecks } from 'lucide-react'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { EmptyState } from '@/components/shared/empty-state'
import { NativeSelect } from '@/components/shared/native-select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessages } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/format'
import type { ExpenseStatus } from '@/types/api'

import { useExpenses } from '../hooks'
import { personText } from '../labels'
import { CategoryFilter } from './category-filter'

interface AllExpensesViewProps {
  categoryId: number | null
  status: ExpenseStatus | null
  onCategoryChange: (categoryId: number | null) => void
  onStatusChange: (status: ExpenseStatus | null) => void
  onOpenExpense: (id: number) => void
  onCreate: () => void
}

/** Visão "Todas" (US4, FR-005): despesas com situação, pago e restante. */
export function AllExpensesView({ categoryId, status, onCategoryChange, onStatusChange, onOpenExpense, onCreate }: AllExpensesViewProps) {
  const expenses = useExpenses(categoryId, status)

  let content
  if (expenses.isPending) {
    content = (
      <div className="space-y-2" aria-busy="true" aria-label="Carregando despesas">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    )
  } else if (expenses.isError) {
    content = (
      <ApiErrorAlert messages={errorMessages(expenses.error)}>
        <Button variant="outline" size="sm" onClick={() => expenses.refetch()}>Tentar novamente</Button>
      </ApiErrorAlert>
    )
  } else {
    const data = expenses.data
    content = (
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Totais das despesas">
          <div className="rounded-xl border px-2 py-2 sm:px-3">
            <dt className="text-xs text-muted-foreground">Pago</dt>
            <dd className="font-heading text-sm font-semibold tabular-nums break-words sm:text-lg">{formatCurrency(data.totalPaidAmount)}</dd>
          </div>
          <div className="rounded-xl border px-2 py-2 sm:px-3">
            <dt className="text-xs text-muted-foreground">Restante</dt>
            <dd className="font-heading text-sm font-semibold tabular-nums break-words sm:text-lg">{formatCurrency(data.totalRemainingAmount)}</dd>
          </div>
          {data.totalDiscountAmount > 0 && (
            <div className="rounded-xl border px-2 py-2 sm:px-3">
              <dt className="text-xs text-muted-foreground">Desconto obtido</dt>
              <dd className="font-heading text-sm font-semibold tabular-nums break-words sm:text-lg">{formatCurrency(data.totalDiscountAmount)}</dd>
            </div>
          )}
        </dl>

        {data.expenses.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Nenhuma despesa encontrada"
            description={categoryId || status ? 'Nada com os filtros escolhidos.' : 'Cadastre as contas e compras da família.'}
            action={<Button onClick={onCreate}>Nova despesa</Button>}
          />
        ) : (
          <ul aria-label="Despesas" className="grid gap-2 md:grid-cols-2">
            {data.expenses.map((expense) => (
              <li key={expense.id}>
                <button
                  type="button"
                  onClick={() => onOpenExpense(expense.id)}
                  className="flex w-full flex-col gap-2 rounded-xl border px-4 py-3 text-left outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50"
                  aria-label={`Abrir ${expense.name}`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{expense.name}</span>
                      <span className="text-xs text-muted-foreground">{expense.category.name}</span>
                    </span>
                    <Badge variant={expense.status === 'Paid' ? 'secondary' : 'outline'}>
                      {expense.status === 'Paid' ? 'Quitada' : 'Em aberto'}
                    </Badge>
                  </span>
                  <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span>{`${expense.paidInstallments}/${expense.installmentsCount} pagas`}</span>
                    <span>{`Pago ${formatCurrency(expense.paidAmount)}`}</span>
                    <span>{`Restante ${formatCurrency(expense.remainingAmount)}`}</span>
                  </span>
                  <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {expense.nextDueDate && <span>{`Próximo vencimento ${formatDate(expense.nextDueDate)}`}</span>}
                    {personText(expense) && <span>{personText(expense)}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <CategoryFilter id="all-category" value={categoryId} onChange={onCategoryChange} />
        <div className="flex items-center gap-2">
          <label htmlFor="all-status" className="text-sm text-muted-foreground">
            Situação
          </label>
          <NativeSelect
            id="all-status"
            className="w-36"
            value={status ?? ''}
            onChange={(event) => onStatusChange((event.target.value || null) as ExpenseStatus | null)}
          >
            <option value="">Todas</option>
            <option value="Open">Em aberto</option>
            <option value="Paid">Quitadas</option>
          </NativeSelect>
        </div>
      </div>
      {content}
    </div>
  )
}
