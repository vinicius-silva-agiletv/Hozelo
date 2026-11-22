import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { MoneyInput } from '@/components/shared/money-input'
import { ResponsiveDialog, ResponsiveDialogFooter } from '@/components/shared/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { errorMessages } from '@/lib/api'
import { isAfterToday, isValidIsoDate, todayIso } from '@/lib/date'

export interface ValueDialogTarget {
  title: string
  description?: string
  /** Mostrar campo de valor (outro valor / ajustar mês). */
  amount?: { label: string; initial: number }
  /** Mostrar campo de data (outra data / outro valor). */
  dateLabel?: string
  confirmLabel: string
  successMessage: string
  onConfirm: (values: { amount?: number; date?: string }) => Promise<unknown>
}

/**
 * Painel de valor e/ou data (data-model.md SettleOnDateForm, SettleWithAmountForm, AdjustMonthForm):
 * "Receber/Pagar em outra data", "com outro valor" e "Ajustar este mês".
 */
export function ValueDialog({ target, onClose }: { target: ValueDialogTarget | null; onClose: () => void }) {
  return (
    <ResponsiveDialog open={target !== null} onOpenChange={(open) => !open && onClose()} title={target?.title ?? ''} description={target?.description}>
      {target && <ValueDialogBody target={target} onDone={onClose} />}
    </ResponsiveDialog>
  )
}

function ValueDialogBody({ target, onDone }: { target: ValueDialogTarget; onDone: () => void }) {
  const [amount, setAmount] = useState(target.amount?.initial ?? 0)
  const [date, setDate] = useState(todayIso())
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)
  const [apiError, setApiError] = useState<unknown>(null)

  const errors = {
    amount: target.amount && !(amount > 0) ? 'Informe um valor maior que zero.' : null,
    date: target.dateLabel
      ? !isValidIsoDate(date)
        ? 'Informe a data.'
        : isAfterToday(date)
          ? 'A data não pode ser futura.'
          : null
      : null,
  }
  const show = (message: string | null) => (submitted && message ? [{ message }] : [])

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (errors.amount || errors.date) return
    setPending(true)
    setApiError(null)
    try {
      await target.onConfirm({ amount: target.amount ? amount : undefined, date: target.dateLabel ? date : undefined })
      toast.success(target.successMessage)
      onDone()
    } catch (error) {
      setApiError(error)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        {target.amount && (
          <Field data-invalid={!!show(errors.amount).length}>
            <FieldLabel htmlFor="value-amount">{target.amount.label}</FieldLabel>
            <MoneyInput id="value-amount" value={amount} onChange={setAmount} autoFocus />
            <FieldError errors={show(errors.amount)} />
          </Field>
        )}
        {target.dateLabel && (
          <Field data-invalid={!!show(errors.date).length}>
            <FieldLabel htmlFor="value-date">{target.dateLabel}</FieldLabel>
            <Input id="value-date" type="date" max={todayIso()} value={date} onChange={(event) => setDate(event.target.value)} />
            <FieldError errors={show(errors.date)} />
          </Field>
        )}
      </FieldGroup>

      {apiError !== null && <ApiErrorAlert messages={errorMessages(apiError)} />}

      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {target.confirmLabel}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}
