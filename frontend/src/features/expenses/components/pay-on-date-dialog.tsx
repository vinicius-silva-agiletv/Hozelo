import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { ResponsiveDialog, ResponsiveDialogFooter } from '@/components/shared/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { errorMessages } from '@/lib/api'
import { isAfterToday, isValidIsoDate, todayIso } from '@/lib/date'

import { useInstallmentPayment } from '../hooks'

/** data-model.md PayOnDateForm.paidOn */
const payOnDateSchema = z.object({
  paidOn: z
    .string()
    .refine(isValidIsoDate, 'Informe a data do pagamento.')
    .refine((value) => !isAfterToday(value), 'A data não pode ser futura.'),
})

type PayOnDateForm = z.infer<typeof payOnDateSchema>

export interface PayTarget {
  expenseId: number
  number: number
  label: string
}

/** "Pagar em outra data" (US2-3): marca a parcela como paga na data escolhida. */
export function PayOnDateDialog({ target, onClose }: { target: PayTarget | null; onClose: () => void }) {
  return (
    <ResponsiveDialog
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Pagar em outra data"
      description={target?.label}
    >
      {target && <PayOnDateBody target={target} onDone={onClose} />}
    </ResponsiveDialog>
  )
}

function PayOnDateBody({ target, onDone }: { target: PayTarget; onDone: () => void }) {
  const payment = useInstallmentPayment()
  const form = useForm<PayOnDateForm>({ resolver: zodResolver(payOnDateSchema), defaultValues: { paidOn: todayIso() } })
  const error = form.formState.errors.paidOn

  const onSubmit = form.handleSubmit(({ paidOn }) =>
    payment.mutate(
      { expenseId: target.expenseId, number: target.number, paid: true, paidOn },
      {
        onSuccess: () => {
          toast.success('Parcela marcada como paga.')
          onDone()
        },
      },
    ),
  )

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field data-invalid={!!error}>
        <FieldLabel htmlFor="paid-on">Data do pagamento</FieldLabel>
        <Input id="paid-on" type="date" max={todayIso()} aria-invalid={!!error} {...form.register('paidOn')} />
        <FieldError errors={[error]} />
      </Field>

      {payment.isError && <ApiErrorAlert messages={errorMessages(payment.error)} />}

      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={payment.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={payment.isPending}>
          {payment.isPending && <Loader2 className="animate-spin" aria-hidden />}
          Marcar como paga
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}
