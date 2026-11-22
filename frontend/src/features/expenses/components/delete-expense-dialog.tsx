import { toast } from 'sonner'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { errorMessages } from '@/lib/api'
import type { ResponseExpense } from '@/types/api'

import { useDeleteExpense } from '../hooks'

/** Remoção com confirmação (FR-010); a recusa da API aparece no diálogo. */
export function DeleteExpenseDialog({
  expense,
  onClose,
  onDeleted,
}: {
  expense: ResponseExpense | null
  onClose: () => void
  onDeleted: () => void
}) {
  const remove = useDeleteExpense()

  const close = () => {
    remove.reset()
    onClose()
  }

  return (
    <ConfirmDialog
      open={expense !== null}
      onOpenChange={(open) => !open && close()}
      title="Remover despesa?"
      description={expense ? `"${expense.name}" e todas as suas parcelas serão removidas. Essa ação não pode ser desfeita.` : undefined}
      confirmLabel="Remover"
      destructive
      pending={remove.isPending}
      onConfirm={() =>
        expense &&
        remove.mutate(expense.id, {
          onSuccess: () => {
            toast.success('Despesa removida.')
            remove.reset()
            onDeleted()
          },
        })
      }
    >
      {remove.isError && <ApiErrorAlert messages={errorMessages(remove.error)} />}
    </ConfirmDialog>
  )
}
