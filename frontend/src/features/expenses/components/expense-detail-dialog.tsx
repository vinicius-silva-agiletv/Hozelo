import { Pencil, PiggyBank, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { ResponsiveDialog } from '@/components/shared/responsive-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError, errorMessages } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ResponseExpense } from '@/types/api'

import { useExpense } from '../hooks'
import { personText } from '../labels'
import { AmortizeDialog } from './amortize-dialog'
import { DeleteExpenseDialog } from './delete-expense-dialog'
import { ExpenseFormDialog } from './expense-form-dialog'
import { PaymentToggle } from './payment-toggle'

/** Detalhe da despesa (US4, FR-006), aberto por `?despesa=id`. */
export function ExpenseDetailDialog({ expenseId, onClose }: { expenseId: number | null; onClose: () => void }) {
  const expense = useExpense(expenseId)
  const notFound = expense.error instanceof ApiError && expense.error.status === 404

  // Despesa removida em outro aparelho: avisa, fecha e as listas são recarregadas (Edge Cases).
  const closedFor = useRef<number | null>(null)
  useEffect(() => {
    if (notFound && expenseId !== null && closedFor.current !== expenseId) {
      closedFor.current = expenseId
      toast.error(errorMessages(expense.error).join(' '))
      onClose()
    }
  }, [notFound, expenseId, expense.error, onClose])

  return (
    <ResponsiveDialog
      open={expenseId !== null && !notFound}
      onOpenChange={(open) => !open && onClose()}
      title={expense.data?.name ?? 'Despesa'}
      description={expense.data ? `${expense.data.category.name}${expense.data.isInstallment ? ` · ${expense.data.installmentsCount} parcelas` : ' · à vista'}` : undefined}
      wide
    >
      {expense.isPending && expenseId !== null && (
        <div className="space-y-2" aria-busy="true" aria-label="Carregando despesa">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {expense.isError && !notFound && (
        <ApiErrorAlert messages={errorMessages(expense.error)}>
          <Button variant="outline" size="sm" onClick={() => expense.refetch()}>Tentar novamente</Button>
        </ApiErrorAlert>
      )}
      {expense.data && <ExpenseDetail expense={expense.data} onDeleted={onClose} />}
    </ResponsiveDialog>
  )
}

function ExpenseDetail({ expense, onDeleted }: { expense: ResponseExpense; onDeleted: () => void }) {
  const [dialog, setDialog] = useState<'edit' | 'amortize' | 'delete' | null>(null)
  const close = () => setDialog(null)
  const person = personText(expense)

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Total</dt>
          <dd className="font-medium tabular-nums">{formatCurrency(expense.totalAmount)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Pago</dt>
          <dd className="font-medium tabular-nums">{formatCurrency(expense.paidAmount)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Restante</dt>
          <dd className="font-medium tabular-nums">{formatCurrency(expense.remainingAmount)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Desconto obtido</dt>
          <dd className="font-medium tabular-nums">{formatCurrency(expense.discountAmount)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Situação</dt>
          <dd className="font-medium">{expense.status === 'Paid' ? 'Quitada' : `${expense.paidInstallments}/${expense.installmentsCount} pagas`}</dd>
        </div>
        {person && (
          <div>
            <dt className="text-muted-foreground">Dividida com</dt>
            <dd className="font-medium">{person}</dd>
          </div>
        )}
        {expense.notes && (
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-muted-foreground">Observação</dt>
            <dd className="break-words">{expense.notes}</dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setDialog('edit')}>
          <Pencil aria-hidden />
          Editar
        </Button>
        <Button variant="outline" size="sm" onClick={() => setDialog('amortize')} disabled={expense.remainingInstallments === 0}>
          <PiggyBank aria-hidden />
          Amortizar
        </Button>
        <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDialog('delete')}>
          <Trash2 aria-hidden />
          Remover
        </Button>
      </div>

      <ul aria-label="Parcelas" className="max-h-[45dvh] divide-y overflow-y-auto rounded-xl border">
        {expense.installments.map((installment) => (
          <li key={installment.number} className="flex items-center gap-3 px-3 py-2 text-sm">
            <PaymentToggle
              expenseId={expense.id}
              number={installment.number}
              isPaid={installment.isPaid}
              prepaid={installment.prepaid}
              label={`${expense.name}, parcela ${installment.number} de ${expense.installmentsCount}`}
            />
            <span className="w-10 shrink-0 text-muted-foreground tabular-nums">{`${installment.number}/${expense.installmentsCount}`}</span>
            <span className="min-w-0 flex-1">
              <span className="block tabular-nums">{formatDate(installment.dueDate)}</span>
              {installment.isPaid && installment.paidOn && (
                <span className="block text-xs text-muted-foreground">
                  {`Paga em ${formatDate(installment.paidOn)}${
                    installment.paidAmount !== null && installment.paidAmount !== installment.amount
                      ? ` · ${formatCurrency(installment.paidAmount)}`
                      : ''
                  }`}
                </span>
              )}
            </span>
            {installment.prepaid && <Badge variant="outline">amortizada</Badge>}
            <span className={cn('shrink-0 font-medium tabular-nums', installment.isPaid && 'text-muted-foreground')}>
              {formatCurrency(installment.amount)}
            </span>
          </li>
        ))}
      </ul>

      <ExpenseFormDialog mode={dialog === 'edit' ? { kind: 'edit', expense } : null} onClose={close} />
      <AmortizeDialog expense={dialog === 'amortize' ? expense : null} onClose={close} />
      <DeleteExpenseDialog
        expense={dialog === 'delete' ? expense : null}
        onClose={close}
        onDeleted={() => {
          close()
          onDeleted()
        }}
      />
    </div>
  )
}
