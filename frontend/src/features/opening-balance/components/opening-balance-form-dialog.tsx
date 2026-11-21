import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { MoneyInput } from '@/components/shared/money-input'
import { ResponsiveDialog, ResponsiveDialogFooter } from '@/components/shared/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { errorMessages } from '@/lib/api'
import type { ResponseOpeningBalance } from '@/types/api'

import { useSaveOpeningBalance } from '../hooks'
import { openingBalanceSchema, toForm, toRequest, type OpeningBalanceForm } from '../schemas'

interface OpeningBalanceFormDialogProps {
  open: boolean
  current: ResponseOpeningBalance | null
  onClose: () => void
}

/** Informar ou alterar o saldo inicial (valor, "Saldo negativo" e data de referência). */
export function OpeningBalanceFormDialog({ open, current, onClose }: OpeningBalanceFormDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={current ? 'Alterar saldo inicial' : 'Informar saldo inicial'}
      description="Quanto a família tinha (ou devia) na data de referência."
    >
      {open && <OpeningBalanceFormBody current={current} onDone={onClose} />}
    </ResponsiveDialog>
  )
}

function OpeningBalanceFormBody({ current, onDone }: { current: ResponseOpeningBalance | null; onDone: () => void }) {
  const save = useSaveOpeningBalance()
  const form = useForm<OpeningBalanceForm>({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: toForm(current),
  })

  const onSubmit = form.handleSubmit((values) =>
    save.mutate(toRequest(values), {
      onSuccess: () => {
        toast.success('Saldo inicial salvo.')
        onDone()
      },
    }),
  )

  const dateError = form.formState.errors.referenceDate

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <Controller
          control={form.control}
          name="amount"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="opening-amount">Valor</FieldLabel>
              <MoneyInput id="opening-amount" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="negative"
          render={({ field }) => (
            <Field orientation="horizontal">
              <Switch id="opening-negative" checked={field.value} onCheckedChange={field.onChange} />
              <FieldLabel htmlFor="opening-negative" className="font-normal">
                Saldo negativo (a família começou devendo)
              </FieldLabel>
            </Field>
          )}
        />

        <Field data-invalid={!!dateError}>
          <FieldLabel htmlFor="opening-date">Data de referência</FieldLabel>
          <Input
            id="opening-date"
            type="date"
            min="2000-01-01"
            max="2100-12-31"
            aria-invalid={!!dateError}
            aria-describedby="opening-date-hint"
            {...form.register('referenceDate')}
          />
          <FieldDescription id="opening-date-hint">Use o saldo que vocês tinham no início do mês.</FieldDescription>
          <FieldError errors={[dateError]} />
        </Field>
      </FieldGroup>

      {save.isError && <ApiErrorAlert messages={errorMessages(save.error)} />}

      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2 className="animate-spin" aria-hidden />}
          Salvar
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}
