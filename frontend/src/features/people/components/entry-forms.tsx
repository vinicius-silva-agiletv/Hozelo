import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { MoneyInput } from '@/components/shared/money-input'
import { ResponsiveDialog, ResponsiveDialogFooter } from '@/components/shared/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { errorMessages } from '@/lib/api'
import { todayIso } from '@/lib/date'
import { formatCurrency, formatDate } from '@/lib/format'
import { addMonths, currentMonth } from '@/lib/month'
import { cn } from '@/lib/utils'
import type { ResponsePersonChargeItem, ResponsePersonPayment } from '@/types/api'

import { usePersonStatement, useSaveCharge, useSavePayment } from '../hooks'
import { chargeSchema, chargeToRequest, paymentSchema, paymentToRequest, type ChargeForm, type PaymentForm } from '../schemas'
import { chargeLabel } from './charge-labels'

export interface PaymentTarget {
  personId: number
  personName: string
  /** Valor sugerido (devido no mês; clarify Q2). */
  suggested?: number
  payment?: ResponsePersonPayment
}

/** Registrar ou editar um pagamento (FR-007, FR-008, FR-015). */
export function PaymentFormDialog({ target, onClose }: { target: PaymentTarget | null; onClose: () => void }) {
  return (
    <ResponsiveDialog
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
      title={target?.payment ? 'Editar pagamento' : 'Pagamento'}
      description={target ? `Quanto ${target.personName} pagou. O valor abate a dívida, das cobranças mais antigas para as mais novas.` : undefined}
    >
      {target && <PaymentFormBody target={target} onDone={onClose} />}
    </ResponsiveDialog>
  )
}

function PaymentFormBody({ target, onDone }: { target: PaymentTarget; onDone: () => void }) {
  const save = useSavePayment(target.personId, target.payment?.id ?? null)
  const editing = target.payment
  const [showCharges, setShowCharges] = useState(!!editing && editing.chargeKeys.length > 0)
  // Cobranças escolhíveis: em aberto no mês atual e no anterior (research.md §5).
  const current = usePersonStatement(target.personId, currentMonth())
  const previous = usePersonStatement(target.personId, addMonths(currentMonth(), -1))
  const selectable = [...(previous.data?.charges ?? []), ...(current.data?.charges ?? [])].filter(
    (charge) => charge.remaining > 0 || editing?.chargeKeys.includes(charge.key),
  )

  const form = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: editing?.amount ?? (target.suggested && target.suggested > 0 ? target.suggested : 0),
      paidOn: editing?.paidOn ?? todayIso(),
      notes: editing?.notes ?? '',
      chargeKeys: editing?.chargeKeys ?? [],
    },
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) =>
    save.mutate(paymentToRequest(values), {
      onSuccess: () => {
        toast.success(editing ? 'Pagamento atualizado.' : 'Pagamento registrado.')
        onDone()
      },
    }),
  )

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="amount"
            render={({ field }) => (
              <Field data-invalid={!!errors.amount}>
                <FieldLabel htmlFor="payment-amount">Valor pago</FieldLabel>
                <MoneyInput id="payment-amount" value={field.value} onChange={field.onChange} aria-invalid={!!errors.amount} />
                <FieldError errors={[errors.amount]} />
              </Field>
            )}
          />
          <Field data-invalid={!!errors.paidOn}>
            <FieldLabel htmlFor="payment-date">Data</FieldLabel>
            <Input id="payment-date" type="date" max={todayIso()} aria-invalid={!!errors.paidOn} {...form.register('paidOn')} />
            <FieldError errors={[errors.paidOn]} />
          </Field>
        </div>
        <Field data-invalid={!!errors.notes}>
          <FieldLabel htmlFor="payment-notes">Observação (opcional)</FieldLabel>
          <Textarea id="payment-notes" rows={2} aria-invalid={!!errors.notes} {...form.register('notes')} />
          <FieldError errors={[errors.notes]} />
        </Field>

        <div className="rounded-lg border">
          <button
            type="button"
            onClick={() => setShowCharges((value) => !value)}
            aria-expanded={showCharges}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Escolher o que este pagamento quita (opcional)
            <ChevronDown className={cn('size-4 transition-transform', showCharges && 'rotate-180')} aria-hidden />
          </button>
          {showCharges && (
            <Controller
              control={form.control}
              name="chargeKeys"
              render={({ field }) =>
                selectable.length === 0 ? (
                  <p className="px-3 pb-3 text-sm text-muted-foreground">Nenhuma cobrança em aberto nos últimos dois meses.</p>
                ) : (
                  <ul aria-label="Cobranças em aberto" className="max-h-56 space-y-1 overflow-y-auto px-3 pb-3">
                    {selectable.map((charge) => {
                      const id = `payment-charge-${charge.key}`
                      const checked = field.value.includes(charge.key)
                      return (
                        <li key={charge.key} className="flex items-center gap-3">
                          <Checkbox
                            id={id}
                            checked={checked}
                            onCheckedChange={(next) =>
                              field.onChange(next === true ? [...field.value, charge.key] : field.value.filter((key) => key !== charge.key))
                            }
                          />
                          <label htmlFor={id} className="flex flex-1 flex-wrap justify-between gap-x-2 text-sm">
                            <span>{`${chargeLabel(charge)} · ${formatDate(charge.date)}`}</span>
                            <span className="tabular-nums text-muted-foreground">{`falta ${formatCurrency(charge.remaining)}`}</span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                )
              }
            />
          )}
        </div>
      </FieldGroup>

      {save.isError && <ApiErrorAlert messages={errorMessages(save.error)} />}

      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {editing ? 'Salvar' : 'Registrar pagamento'}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}

export interface ChargeTarget {
  personId: number
  charge?: ResponsePersonChargeItem
}

/** Lançar ou editar cobrança avulsa (FR-009; sem observação, research.md §6). */
export function ChargeFormDialog({ target, onClose }: { target: ChargeTarget | null; onClose: () => void }) {
  return (
    <ResponsiveDialog
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
      title={target?.charge ? 'Editar cobrança' : 'Cobrança avulsa'}
      description={target?.charge ? undefined : 'Um valor que a pessoa deve fora das despesas da família.'}
    >
      {target && <ChargeFormBody target={target} onDone={onClose} />}
    </ResponsiveDialog>
  )
}

function ChargeFormBody({ target, onDone }: { target: ChargeTarget; onDone: () => void }) {
  const save = useSaveCharge(target.personId, target.charge?.originId ?? null)
  const form = useForm<ChargeForm>({
    resolver: zodResolver(chargeSchema),
    defaultValues: {
      description: target.charge?.description ?? '',
      amount: target.charge?.amount ?? 0,
      chargeDate: target.charge?.date ?? todayIso(),
    },
  })
  const { errors } = form.formState

  const onSubmit = form.handleSubmit((values) =>
    save.mutate(chargeToRequest(values), {
      onSuccess: () => {
        toast.success(target.charge ? 'Cobrança atualizada.' : 'Cobrança lançada.')
        onDone()
      },
    }),
  )

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="charge-description">Descrição</FieldLabel>
          <Input id="charge-description" autoComplete="off" maxLength={120} aria-invalid={!!errors.description} {...form.register('description')} />
          <FieldError errors={[errors.description]} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="amount"
            render={({ field }) => (
              <Field data-invalid={!!errors.amount}>
                <FieldLabel htmlFor="charge-amount">Valor</FieldLabel>
                <MoneyInput id="charge-amount" value={field.value} onChange={field.onChange} aria-invalid={!!errors.amount} />
                <FieldError errors={[errors.amount]} />
              </Field>
            )}
          />
          <Field data-invalid={!!errors.chargeDate}>
            <FieldLabel htmlFor="charge-date">Data</FieldLabel>
            <Input id="charge-date" type="date" min="2000-01-01" max="2100-12-31" aria-invalid={!!errors.chargeDate} {...form.register('chargeDate')} />
            <FieldError errors={[errors.chargeDate]} />
          </Field>
        </div>
      </FieldGroup>

      {save.isError && <ApiErrorAlert messages={errorMessages(save.error)} />}

      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {target.charge ? 'Salvar' : 'Lançar cobrança'}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}
