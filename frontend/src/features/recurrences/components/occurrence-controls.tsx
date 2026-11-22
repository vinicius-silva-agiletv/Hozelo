import { CalendarCheck, CircleDollarSign, EllipsisVertical, PencilLine, SkipForward, Undo2 } from 'lucide-react'
import { toast } from 'sonner'

import { PaymentToggle } from '@/components/shared/payment-toggle'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { errorMessages } from '@/lib/api'
import { formatMonth } from '@/lib/month'
import type { EntryKind } from '@/types/api'

import { useRecurrenceAction } from '../hooks'
import type { Occurrence } from '../occurrence'
import { kindWords } from '../words'
import type { ValueDialogTarget } from './settle-dialogs'

interface OccurrenceProps {
  recurrenceId: number
  kind: EntryKind
  name: string
  month: string
  occurrence: Occurrence
}

/** Caixa de pago/recebido da ocorrência do mês (FR-003, FR-007); pulada não tem caixa. */
export function OccurrenceToggle({ recurrenceId, kind, name, month, occurrence }: OccurrenceProps) {
  const action = useRecurrenceAction(recurrenceId)
  const words = kindWords[kind]
  if (occurrence.status === 'skipped') return <span className="size-5 shrink-0" aria-hidden />
  return (
    <PaymentToggle
      isPaid={occurrence.status === 'settled'}
      label={`${name}, ${formatMonth(month)}`}
      states={{ on: words.done, off: words.open }}
      messages={{ paid: words.settledMsg, unpaid: words.undoneMsg }}
      onToggle={(paid) => action.mutateAsync(paid ? { type: 'settle', month } : { type: 'undoSettlement', month })}
    />
  )
}

/**
 * Menu da ocorrência (FR-003, FR-007, FR-009): com outro valor, em outra data, ajustar e pular
 * (em aberto) e desfazer ajuste (ajustada ou pulada). Sem ações possíveis, não aparece.
 */
export function OccurrenceMenu({ recurrenceId, kind, name, month, occurrence, onOpenDialog }: OccurrenceProps & { onOpenDialog: (target: ValueDialogTarget) => void }) {
  const action = useRecurrenceAction(recurrenceId)
  const words = kindWords[kind]
  const isOpen = occurrence.status === 'open'
  const canUndo = occurrence.status === 'skipped' || occurrence.adjusted
  if (!isOpen && !canUndo) return <span className="size-9 shrink-0" aria-hidden />

  const description = `${name} · ${formatMonth(month)}`
  const quick = (run: () => Promise<unknown>, success: string) =>
    run().then(
      () => toast.success(success),
      (error) => toast.error(errorMessages(error).join(' ')),
    )

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Ações de ${name}`}>
          <EllipsisVertical aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isOpen && (
          <>
            <DropdownMenuItem
              onSelect={() =>
                onOpenDialog({
                  title: `${words.act} com outro valor`,
                  description,
                  amount: { label: 'Valor', initial: occurrence.amount },
                  dateLabel: words.dateLabel,
                  confirmLabel: words.act,
                  successMessage: words.settledMsg,
                  onConfirm: ({ amount, date }) => action.mutateAsync({ type: 'settleWithAmount', month, amount: amount!, settledOn: date }),
                })
              }
            >
              <CircleDollarSign aria-hidden />
              {`${words.act} com outro valor`}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                onOpenDialog({
                  title: `${words.act} em outra data`,
                  description,
                  dateLabel: words.dateLabel,
                  confirmLabel: words.act,
                  successMessage: words.settledMsg,
                  onConfirm: ({ date }) => action.mutateAsync({ type: 'settle', month, settledOn: date }),
                })
              }
            >
              <CalendarCheck aria-hidden />
              {`${words.act} em outra data`}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                onOpenDialog({
                  title: 'Ajustar este mês',
                  description,
                  amount: { label: 'Valor deste mês', initial: occurrence.amount },
                  confirmLabel: 'Ajustar',
                  successMessage: 'Valor do mês ajustado.',
                  onConfirm: ({ amount }) => action.mutateAsync({ type: 'adjust', month, amount: amount! }),
                })
              }
            >
              <PencilLine aria-hidden />
              Ajustar este mês
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void quick(() => action.mutateAsync({ type: 'skip', month }), 'Mês pulado.')}>
              <SkipForward aria-hidden />
              Pular este mês
            </DropdownMenuItem>
          </>
        )}
        {canUndo && (
          <DropdownMenuItem onSelect={() => void quick(() => action.mutateAsync({ type: 'undoAdjustment', month }), 'Ajuste desfeito.')}>
            <Undo2 aria-hidden />
            Desfazer ajuste
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
