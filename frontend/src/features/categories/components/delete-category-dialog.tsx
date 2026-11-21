import { toast } from 'sonner'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { errorMessages } from '@/lib/api'
import type { ResponseCategory } from '@/types/api'

import { useDeleteCategory } from '../hooks'

/**
 * Confirmação de remoção (research.md §7): fica aberta enquanto remove e mostra a recusa da API
 * (ex.: categoria com lançamentos) dentro do diálogo; fecha só quando a remoção dá certo.
 */
export function DeleteCategoryDialog({ category, onClose }: { category: ResponseCategory | null; onClose: () => void }) {
  const remove = useDeleteCategory()

  const close = () => {
    remove.reset()
    onClose()
  }

  return (
    <ConfirmDialog
      open={category !== null}
      onOpenChange={(open) => !open && close()}
      title="Remover categoria?"
      description={category ? `A categoria "${category.name}" será removida. Essa ação não pode ser desfeita.` : undefined}
      confirmLabel="Remover"
      destructive
      pending={remove.isPending}
      onConfirm={() =>
        category &&
        remove.mutate(category.id, {
          onSuccess: () => {
            toast.success('Categoria removida.')
            close()
          },
        })
      }
    >
      {remove.isError && <ApiErrorAlert messages={errorMessages(remove.error)} />}
    </ConfirmDialog>
  )
}
