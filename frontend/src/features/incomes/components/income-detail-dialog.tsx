import { Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PaymentToggle } from '@/components/shared/payment-toggle'
import { ResponsiveDialog } from '@/components/shared/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { kindWords } from '@/features/recurrences/words'
import { ApiError, errorMessages } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/format'
import type { ResponseIncome } from '@/types/api'

import { useDeleteIncome, useIncome, useIncomeReceipt } from '../hooks'
import { IncomeFormDialog } from './income-form-dialog'

/** Detalhe da receita avulsa (US6), aberto por `?receita=id`. */
export function IncomeDetailDialog({ incomeId, onClose }: { incomeId: number | null; onClose: () => void }) {
  const income = useIncome(incomeId)
  const notFound = income.error instanceof ApiError && income.error.status === 404

  const closedFor = useRef<number | null>(null)
  useEffect(() => {
    if (notFound && incomeId !== null && closedFor.current !== incomeId) {
      closedFor.current = incomeId
      toast.error(errorMessages(income.error).join(' '))
      onClose()
    }
  }, [notFound, incomeId, income.error, onClose])

  return (
    <ResponsiveDialog
      open={incomeId !== null && !notFound}
      onOpenChange={(open) => !open && onClose()}
      title={income.data?.name ?? 'Receita'}
      description={income.data ? `${income.data.category.name} · avulsa` : undefined}
    >
      {income.isPending && incomeId !== null && <Skeleton className="h-24 w-full" aria-label="Carregando receita" />}
      {income.isError && !notFound && (
        <ApiErrorAlert messages={errorMessages(income.error)}>
          <Button variant="outline" size="sm" onClick={() => income.refetch()}>Tentar novamente</Button>
        </ApiErrorAlert>
      )}
      {income.data && <IncomeDetail income={income.data} onDeleted={onClose} />}
    </ResponsiveDialog>
  )
}

function IncomeDetail({ income, onDeleted }: { income: ResponseIncome; onDeleted: () => void }) {
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null)
  const receipt = useIncomeReceipt(income.id)
  const remove = useDeleteIncome()
  const words = kindWords.Income

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Valor</dt>
          <dd className="font-medium tabular-nums">{formatCurrency(income.amount)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Data prevista</dt>
          <dd className="font-medium">{formatDate(income.expectedDate)}</dd>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <PaymentToggle
            isPaid={income.isReceived}
            label={income.name}
            states={{ on: words.done, off: words.open }}
            messages={{ paid: words.settledMsg, unpaid: words.undoneMsg }}
            onToggle={(received) => receipt.mutateAsync({ received })}
          />
          <span>{income.isReceived && income.receivedOn ? `Recebida em ${formatDate(income.receivedOn)}` : 'A receber'}</span>
        </div>
        {income.notes && (
          <div className="col-span-2">
            <dt className="text-muted-foreground">Observação</dt>
            <dd className="break-words">{income.notes}</dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setDialog('edit')}>
          <Pencil aria-hidden />
          Editar
        </Button>
        <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDialog('delete')}>
          <Trash2 aria-hidden />
          Remover
        </Button>
      </div>

      <IncomeFormDialog mode={dialog === 'edit' ? { kind: 'edit', income } : null} onClose={() => setDialog(null)} />
      <ConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={(open) => {
          if (!open) {
            remove.reset()
            setDialog(null)
          }
        }}
        title="Remover receita?"
        description={`"${income.name}" será removida. Essa ação não pode ser desfeita.`}
        confirmLabel="Remover"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(income.id, {
            onSuccess: () => {
              toast.success('Receita removida.')
              remove.reset()
              setDialog(null)
              onDeleted()
            },
          })
        }
      >
        {remove.isError && <ApiErrorAlert messages={errorMessages(remove.error)} />}
      </ConfirmDialog>
    </div>
  )
}
