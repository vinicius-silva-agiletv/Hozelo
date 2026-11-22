import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { MoneyInput } from '@/components/shared/money-input'
import { ResponsiveDialog, ResponsiveDialogFooter } from '@/components/shared/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { errorMessages } from '@/lib/api'
import { isAfterToday, isValidIsoDate, todayIso } from '@/lib/date'
import { formatCurrency, formatDate, pluralize } from '@/lib/format'
import { fromCents, toCents } from '@/lib/money'
import type { ResponseExpense } from '@/types/api'

import { useAmortizeExpense } from '../hooks'
import { amortizationPreview } from '../preview'
import { OptionGroup } from '@/components/shared/option-group'

/** Amortizar parcelas futuras (US5, FR-011). */
export function AmortizeDialog({ expense, onClose }: { expense: ResponseExpense | null; onClose: () => void }) {
  return (
    <ResponsiveDialog
      open={expense !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Amortizar parcelas"
      description={expense ? `${expense.name}: adiante parcelas em aberto informando o valor efetivamente pago.` : undefined}
    >
      {expense && <AmortizeBody expense={expense} onDone={onClose} />}
    </ResponsiveDialog>
  )
}

type Mode = 'last' | 'pick'

function AmortizeBody({ expense, onDone }: { expense: ResponseExpense; onDone: () => void }) {
  const amortize = useAmortizeExpense(expense.id)
  const open = expense.installments.filter((installment) => !installment.isPaid)

  // data-model.md AmortizeForm (mode, quantity, installmentNumbers, paidOn, paidAmount)
  const [mode, setMode] = useState<Mode>('last')
  const [quantity, setQuantity] = useState(String(Math.min(1, open.length)))
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [paidOn, setPaidOn] = useState(todayIso())
  const [paidAmount, setPaidAmount] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const quantityNumber = Number(quantity)
  const quantityValid = Number.isInteger(quantityNumber) && quantityNumber >= 1 && quantityNumber <= open.length
  const chosen =
    mode === 'last'
      ? quantityValid ? open.slice(open.length - quantityNumber) : []
      : open.filter((installment) => picked.has(installment.number))
  const sumCents = chosen.reduce((total, installment) => total + toCents(installment.amount), 0)
  const amount = paidAmount ?? fromCents(sumCents)
  const preview = amortizationPreview(chosen.map((installment) => toCents(installment.amount)), toCents(amount))

  const errors = {
    quantity: mode === 'last' && !quantityValid ? `Informe de 1 a ${open.length} parcelas.` : null,
    picked: mode === 'pick' && chosen.length === 0 ? 'Escolha ao menos uma parcela.' : null,
    paidOn: !isValidIsoDate(paidOn) ? 'Informe a data do pagamento.' : isAfterToday(paidOn) ? 'A data não pode ser futura.' : null,
    paidAmount:
      chosen.length > 0 && !(toCents(amount) > 0 && toCents(amount) <= sumCents)
        ? `O valor pago deve ser maior que zero e no máximo ${formatCurrency(fromCents(sumCents))}.`
        : null,
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const show = (message: string | null) => (submitted && message ? [{ message }] : [])

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (hasErrors) return
    amortize.mutate(
      {
        ...(mode === 'last' ? { quantity: quantityNumber } : { installmentNumbers: chosen.map((installment) => installment.number) }),
        paidOn,
        paidAmount: amount,
      },
      {
        onSuccess: () => {
          toast.success('Amortização registrada.')
          onDone()
        },
      },
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <OptionGroup
          name="amortize-mode"
          legend="Quais parcelas"
          value={mode}
          options={[
            { value: 'last', label: 'As últimas' },
            { value: 'pick', label: 'Escolher' },
          ]}
          onChange={(next) => {
            setMode(next)
            setPaidAmount(null)
          }}
        />

        {mode === 'last' ? (
          <Field data-invalid={!!show(errors.quantity).length}>
            <FieldLabel htmlFor="amortize-quantity">{`Quantidade (de ${open.length} em aberto)`}</FieldLabel>
            <Input
              id="amortize-quantity"
              type="number"
              inputMode="numeric"
              min={1}
              max={open.length}
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value)
                setPaidAmount(null)
              }}
            />
            <FieldError errors={show(errors.quantity)} />
          </Field>
        ) : (
          <fieldset className="space-y-1.5">
            <legend className="mb-1.5 text-sm font-medium">Parcelas em aberto</legend>
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
              {open.map((installment) => {
                const id = `amortize-${installment.number}`
                return (
                  <li key={installment.number} className="flex items-center gap-3 px-1 py-0.5">
                    <Checkbox
                      id={id}
                      checked={picked.has(installment.number)}
                      onCheckedChange={(checked) => {
                        setPicked((current) => {
                          const next = new Set(current)
                          if (checked === true) next.add(installment.number)
                          else next.delete(installment.number)
                          return next
                        })
                        setPaidAmount(null)
                      }}
                    />
                    <label htmlFor={id} className="flex flex-1 justify-between gap-2 text-sm">
                      <span>{`Parcela ${installment.number} · ${formatDate(installment.dueDate)}`}</span>
                      <span className="tabular-nums">{formatCurrency(installment.amount)}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
            <FieldError errors={show(errors.picked)} />
          </fieldset>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!show(errors.paidOn).length}>
            <FieldLabel htmlFor="amortize-date">Data do pagamento</FieldLabel>
            <Input id="amortize-date" type="date" max={todayIso()} value={paidOn} onChange={(event) => setPaidOn(event.target.value)} />
            <FieldError errors={show(errors.paidOn)} />
          </Field>
          <Field data-invalid={!!show(errors.paidAmount).length}>
            <FieldLabel htmlFor="amortize-amount">Valor pago</FieldLabel>
            <MoneyInput id="amortize-amount" value={amount} onChange={setPaidAmount} />
            <FieldError errors={show(errors.paidAmount)} />
          </Field>
        </div>
      </FieldGroup>

      {chosen.length > 0 && (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm font-medium" data-testid="amortize-summary" aria-live="polite">
          {`${pluralize(chosen.length, 'parcela', 'parcelas')} · ${formatCurrency(fromCents(preview.sum))} · desconto de ${formatCurrency(fromCents(preview.discount))}`}
        </p>
      )}

      {amortize.isError && <ApiErrorAlert messages={errorMessages(amortize.error)} />}

      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={amortize.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={amortize.isPending || open.length === 0}>
          {amortize.isPending && <Loader2 className="animate-spin" aria-hidden />}
          Amortizar
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}
