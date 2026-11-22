import { CalendarX2, CalendarSync, Loader2, Pencil, Trash2, TrendingUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { MoneyInput } from '@/components/shared/money-input'
import { MonthPicker } from '@/components/shared/month-picker'
import { ResponsiveDialog, ResponsiveDialogFooter } from '@/components/shared/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError, errorMessages } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/format'
import { formatMonth } from '@/lib/month'
import type { ResponseRecurrence } from '@/types/api'

import { useDeleteRecurrence, useRecurrence, useRecurrenceAction } from '../hooks'
import { RecurrenceFormDialog } from './recurrence-form-dialog'

const personText = (recurrence: ResponseRecurrence) =>
  recurrence.person ? `${recurrence.person.name} · ${recurrence.personPercent ?? 100}%` : null

/** Detalhe da recorrência (FR-010, FR-011), aberto por `?recorrencia=id` nas duas telas. */
export function RecurrenceDetailDialog({ recurrenceId, viewMonth, onClose }: { recurrenceId: number | null; viewMonth: string; onClose: () => void }) {
  const recurrence = useRecurrence(recurrenceId)
  const notFound = recurrence.error instanceof ApiError && recurrence.error.status === 404

  const closedFor = useRef<number | null>(null)
  useEffect(() => {
    if (notFound && recurrenceId !== null && closedFor.current !== recurrenceId) {
      closedFor.current = recurrenceId
      toast.error(errorMessages(recurrence.error).join(' '))
      onClose()
    }
  }, [notFound, recurrenceId, recurrence.error, onClose])

  const data = recurrence.data
  return (
    <ResponsiveDialog
      open={recurrenceId !== null && !notFound}
      onOpenChange={(open) => !open && onClose()}
      title={data?.name ?? 'Recorrência'}
      description={data ? `${data.category.name} · ${data.kind === 'Expense' ? 'conta fixa' : 'receita recorrente'}` : undefined}
      wide
    >
      {recurrence.isPending && recurrenceId !== null && <Skeleton className="h-40 w-full" aria-label="Carregando recorrência" />}
      {recurrence.isError && !notFound && (
        <ApiErrorAlert messages={errorMessages(recurrence.error)}>
          <Button variant="outline" size="sm" onClick={() => recurrence.refetch()}>Tentar novamente</Button>
        </ApiErrorAlert>
      )}
      {data && <RecurrenceDetail recurrence={data} viewMonth={viewMonth} onDeleted={onClose} />}
    </ResponsiveDialog>
  )
}

function RecurrenceDetail({ recurrence, viewMonth, onDeleted }: { recurrence: ResponseRecurrence; viewMonth: string; onDeleted: () => void }) {
  const [dialog, setDialog] = useState<'edit' | 'amount' | 'end' | 'delete' | null>(null)
  const action = useRecurrenceAction(recurrence.id)
  const close = () => setDialog(null)
  const person = personText(recurrence)
  const defaultMonth = viewMonth < recurrence.startMonth ? recurrence.startMonth : viewMonth
  const marked = recurrence.months.filter((m) => m.amount !== null || m.skipped || m.settledOn)

  const reopen = () =>
    action.mutateAsync({ type: 'reopen' }).then(
      () => toast.success('Recorrência reaberta.'),
      (error) => toast.error(errorMessages(error).join(' ')),
    )

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Valor atual</dt>
          <dd className="font-medium tabular-nums">{formatCurrency(recurrence.currentAmount)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Dia</dt>
          <dd className="font-medium">{`dia ${recurrence.dayOfMonth}`}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Início</dt>
          <dd className="font-medium first-letter:uppercase">{formatMonth(recurrence.startMonth)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Fim</dt>
          <dd className="font-medium first-letter:uppercase">{recurrence.endMonth ? formatMonth(recurrence.endMonth) : 'Sem fim'}</dd>
        </div>
        {person && (
          <div>
            <dt className="text-muted-foreground">Dividida com</dt>
            <dd className="font-medium">{person}</dd>
          </div>
        )}
        {recurrence.notes && (
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-muted-foreground">Observação</dt>
            <dd className="break-words">{recurrence.notes}</dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setDialog('edit')}>
          <Pencil aria-hidden />
          Editar
        </Button>
        <Button variant="outline" size="sm" onClick={() => setDialog('amount')}>
          <TrendingUp aria-hidden />
          Mudar valor
        </Button>
        {recurrence.endMonth ? (
          <Button variant="outline" size="sm" onClick={() => void reopen()} disabled={action.isPending}>
            <CalendarSync aria-hidden />
            Reabrir
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setDialog('end')}>
            <CalendarX2 aria-hidden />
            Encerrar
          </Button>
        )}
        <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDialog('delete')}>
          <Trash2 aria-hidden />
          Remover
        </Button>
      </div>

      <section aria-label="Histórico de valores" className="space-y-1.5">
        <h3 className="text-sm font-medium">Histórico de valores</h3>
        <ul className="divide-y rounded-xl border text-sm">
          {recurrence.amounts.map((entry) => (
            <li key={entry.fromMonth} className="flex justify-between gap-2 px-3 py-2">
              <span className="first-letter:uppercase">{`A partir de ${formatMonth(entry.fromMonth)}`}</span>
              <span className="font-medium tabular-nums">{formatCurrency(entry.amount)}</span>
            </li>
          ))}
        </ul>
      </section>

      {marked.length > 0 && (
        <section aria-label="Meses com ajuste ou quitação" className="space-y-1.5">
          <h3 className="text-sm font-medium">Meses com ajuste ou quitação</h3>
          <ul className="max-h-48 divide-y overflow-y-auto rounded-xl border text-sm">
            {marked.map((record) => (
              <li key={record.month} className="flex flex-wrap justify-between gap-2 px-3 py-2">
                <span className="first-letter:uppercase">{formatMonth(record.month)}</span>
                <span className="text-muted-foreground">
                  {[
                    record.skipped ? 'pulado' : null,
                    record.amount !== null ? `ajustado para ${formatCurrency(record.amount)}` : null,
                    record.settledOn ? `${recurrence.kind === 'Expense' ? 'paga' : 'recebida'} em ${formatDate(record.settledOn)}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RecurrenceFormDialog mode={dialog === 'edit' ? { kind: 'edit', recurrence } : null} onClose={close} />
      <MonthValueDialog
        open={dialog === 'amount'}
        onClose={close}
        title="Mudar valor"
        description="Vale a partir do mês escolhido; os meses anteriores continuam com o valor de antes."
        amountLabel="Novo valor"
        initialAmount={recurrence.currentAmount}
        monthLabel="A partir de"
        initialMonth={defaultMonth}
        minMonth={recurrence.startMonth}
        minMonthMessage="O mês não pode ser antes do início."
        confirmLabel="Mudar valor"
        successMessage="Valor alterado."
        onConfirm={({ amount, month }) => action.mutateAsync({ type: 'changeAmount', amount: amount!, fromMonth: month })}
      />
      <MonthValueDialog
        open={dialog === 'end'}
        onClose={close}
        title="Encerrar"
        description="A recorrência não aparece depois do último mês. Dá para reabrir depois."
        monthLabel="Último mês"
        initialMonth={defaultMonth}
        minMonth={recurrence.startMonth}
        minMonthMessage="O fim não pode ser antes do início."
        confirmLabel="Encerrar"
        successMessage="Recorrência encerrada."
        onConfirm={({ month }) => action.mutateAsync({ type: 'end', endMonth: month })}
      />
      <DeleteRecurrenceDialog
        recurrence={dialog === 'delete' ? recurrence : null}
        onClose={close}
        onDeleted={() => {
          close()
          onDeleted()
        }}
      />
    </div>
  )
}

interface MonthValueDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description: string
  amountLabel?: string
  initialAmount?: number
  monthLabel: string
  initialMonth: string
  minMonth: string
  minMonthMessage: string
  confirmLabel: string
  successMessage: string
  onConfirm: (values: { amount?: number; month: string }) => Promise<unknown>
}

/** Valor e mês (data-model.md ChangeAmountForm, EndForm). */
function MonthValueDialog(props: MonthValueDialogProps) {
  return (
    <ResponsiveDialog open={props.open} onOpenChange={(open) => !open && props.onClose()} title={props.title} description={props.description}>
      {props.open && <MonthValueBody {...props} />}
    </ResponsiveDialog>
  )
}

function MonthValueBody({ onClose, amountLabel, initialAmount = 0, monthLabel, initialMonth, minMonth, minMonthMessage, confirmLabel, successMessage, onConfirm }: MonthValueDialogProps) {
  const [amount, setAmount] = useState(initialAmount)
  const [month, setMonth] = useState(initialMonth)
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)
  const [apiError, setApiError] = useState<unknown>(null)

  const errors = {
    amount: amountLabel && !(amount > 0) ? 'Informe um valor maior que zero.' : null,
    month: month < minMonth ? minMonthMessage : null,
  }
  const show = (message: string | null) => (submitted && message ? [{ message }] : [])

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (errors.amount || errors.month) return
    setPending(true)
    setApiError(null)
    try {
      await onConfirm({ amount: amountLabel ? amount : undefined, month })
      toast.success(successMessage)
      onClose()
    } catch (error) {
      setApiError(error)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {amountLabel && (
        <Field data-invalid={!!show(errors.amount).length}>
          <FieldLabel htmlFor="month-value-amount">{amountLabel}</FieldLabel>
          <MoneyInput id="month-value-amount" value={amount} onChange={setAmount} />
          <FieldError errors={show(errors.amount)} />
        </Field>
      )}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{monthLabel}</p>
        <MonthPicker label={monthLabel} value={month} onChange={setMonth} />
        <FieldError errors={show(errors.month)} />
      </div>

      {apiError !== null && <ApiErrorAlert messages={errorMessages(apiError)} />}

      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {confirmLabel}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}

function DeleteRecurrenceDialog({ recurrence, onClose, onDeleted }: { recurrence: ResponseRecurrence | null; onClose: () => void; onDeleted: () => void }) {
  const remove = useDeleteRecurrence()
  const close = () => {
    remove.reset()
    onClose()
  }
  return (
    <ConfirmDialog
      open={recurrence !== null}
      onOpenChange={(open) => !open && close()}
      title="Remover recorrência?"
      description={recurrence ? `"${recurrence.name}" some de todos os meses, inclusive dos já quitados. Essa ação não pode ser desfeita.` : undefined}
      confirmLabel="Remover"
      destructive
      pending={remove.isPending}
      onConfirm={() =>
        recurrence &&
        remove.mutate(recurrence.id, {
          onSuccess: () => {
            toast.success('Recorrência removida.')
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
