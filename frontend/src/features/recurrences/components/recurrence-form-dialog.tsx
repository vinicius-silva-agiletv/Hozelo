import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { MoneyInput } from '@/components/shared/money-input'
import { MonthPicker } from '@/components/shared/month-picker'
import { NativeSelect } from '@/components/shared/native-select'
import { NoCategoriesAlert } from '@/components/shared/no-categories-alert'
import { PersonSplitFields } from '@/components/shared/person-split-fields'
import { ResponsiveDialog, ResponsiveDialogFooter } from '@/components/shared/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useCategories } from '@/features/categories/hooks'
import { errorMessages } from '@/lib/api'
import { parseIsoDate, todayIso } from '@/lib/date'
import { toCents } from '@/lib/money'
import { currentMonth } from '@/lib/month'
import type { EntryKind, ResponseRecurrence } from '@/types/api'

import { useCreateRecurrence, useUpdateRecurrence } from '../hooks'
import { emptyRecurrenceForm, formToCreateRequest, formToUpdateRequest, recurrenceSchema, recurrenceToForm, type RecurrenceForm } from '../schemas'

export type RecurrenceFormMode = { kind: 'create'; entryKind: EntryKind; viewMonth: string | null } | { kind: 'edit'; recurrence: ResponseRecurrence }

const createdMessage: Record<EntryKind, string> = { Income: 'Receita recorrente cadastrada.', Expense: 'Conta fixa cadastrada.' }

/** Cadastrar ou editar uma recorrência (receita recorrente ou conta fixa; FR-004, FR-008, FR-010). */
export function RecurrenceFormDialog({ mode, onClose }: { mode: RecurrenceFormMode | null; onClose: () => void }) {
  const entryKind = mode?.kind === 'edit' ? mode.recurrence.kind : mode?.entryKind
  const title =
    mode?.kind === 'edit' ? 'Editar recorrência' : entryKind === 'Expense' ? 'Nova conta fixa' : 'Nova receita recorrente'
  return (
    <ResponsiveDialog open={mode !== null} onOpenChange={(open) => !open && onClose()} title={title}>
      {mode && <RecurrenceFormBody mode={mode} onDone={onClose} />}
    </ResponsiveDialog>
  )
}

const numberOrNaN = (value: string) => (value === '' ? Number.NaN : Number(value))

/** Corpo do formulário (também usado pelo modo "Todo mês" de "Nova receita"). */
export function RecurrenceFormBody({ mode, onDone }: { mode: RecurrenceFormMode; onDone: () => void }) {
  const isEdit = mode.kind === 'edit'
  const kind: EntryKind = isEdit ? mode.recurrence.kind : mode.entryKind
  const categories = useCategories(kind)
  const create = useCreateRecurrence()
  const update = useUpdateRecurrence(isEdit ? mode.recurrence.id : 0)
  const mutation = isEdit ? update : create

  const form = useForm<RecurrenceForm>({
    resolver: zodResolver(recurrenceSchema),
    defaultValues: isEdit
      ? recurrenceToForm(mode.recurrence)
      : emptyRecurrenceForm(mode.viewMonth ?? currentMonth(), parseIsoDate(todayIso()).day),
  })
  const { errors } = form.formState
  const [amount, hasEnd] = useWatch({ control: form.control, name: ['amount', 'hasEnd'] })
  const noCategories = categories.isSuccess && categories.data.length === 0

  const onSubmit = form.handleSubmit((values) => {
    if (isEdit) {
      update.mutate(formToUpdateRequest(values, kind), {
        onSuccess: () => {
          toast.success('Recorrência atualizada.')
          onDone()
        },
      })
    } else {
      create.mutate(formToCreateRequest(values, kind), {
        onSuccess: () => {
          toast.success(createdMessage[kind])
          onDone()
        },
      })
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="recurrence-name">Nome</FieldLabel>
          <Input id="recurrence-name" autoComplete="off" maxLength={120} aria-invalid={!!errors.name} {...form.register('name')} />
          <FieldError errors={[errors.name]} />
        </Field>

        {noCategories ? (
          <NoCategoriesAlert type={kind} />
        ) : (
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <Field data-invalid={!!errors.categoryId}>
                <FieldLabel htmlFor="recurrence-category">Categoria</FieldLabel>
                <NativeSelect
                  id="recurrence-category"
                  value={field.value ?? ''}
                  aria-invalid={!!errors.categoryId}
                  onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : null)}
                >
                  <option value="">Escolha...</option>
                  {categories.data?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </NativeSelect>
                <FieldError errors={[errors.categoryId]} />
              </Field>
            )}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {!isEdit && (
            <Controller
              control={form.control}
              name="amount"
              render={({ field }) => (
                <Field data-invalid={!!errors.amount}>
                  <FieldLabel htmlFor="recurrence-amount">Valor por mês</FieldLabel>
                  <MoneyInput id="recurrence-amount" value={field.value} onChange={field.onChange} aria-invalid={!!errors.amount} />
                  <FieldError errors={[errors.amount]} />
                </Field>
              )}
            />
          )}
          <Field data-invalid={!!errors.dayOfMonth}>
            <FieldLabel htmlFor="recurrence-day">{kind === 'Expense' ? 'Dia do vencimento' : 'Dia do recebimento'}</FieldLabel>
            <Input
              id="recurrence-day"
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              aria-invalid={!!errors.dayOfMonth}
              {...form.register('dayOfMonth', { setValueAs: numberOrNaN })}
            />
            <FieldError errors={[errors.dayOfMonth]} />
          </Field>
        </div>

        {!isEdit && (
          <>
            <Controller
              control={form.control}
              name="startMonth"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Começa em</p>
                  <MonthPicker label="Mês de início" value={field.value} onChange={field.onChange} />
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="hasEnd"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Switch id="recurrence-has-end" checked={field.value} onCheckedChange={field.onChange} />
                  <FieldLabel htmlFor="recurrence-has-end" className="font-normal">
                    Tem data para terminar
                  </FieldLabel>
                </Field>
              )}
            />
            {hasEnd && (
              <Controller
                control={form.control}
                name="endMonth"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">Último mês</p>
                    <MonthPicker label="Último mês" value={field.value} onChange={field.onChange} />
                    <FieldError errors={[errors.endMonth]} />
                  </div>
                )}
              />
            )}
          </>
        )}

        <Field data-invalid={!!errors.notes}>
          <FieldLabel htmlFor="recurrence-notes">Observação (opcional)</FieldLabel>
          <Textarea id="recurrence-notes" rows={2} aria-invalid={!!errors.notes} {...form.register('notes')} />
          <FieldError errors={[errors.notes]} />
        </Field>

        {kind === 'Expense' && (
          <PersonSplitFields
            idPrefix="recurrence"
            control={form.control}
            register={form.register}
            errors={errors}
            periodCents={isEdit ? toCents(mode.recurrence.currentAmount) : amount > 0 ? toCents(amount) : null}
            periodLabel="por mês"
          />
        )}
      </FieldGroup>

      {mutation.isError && <ApiErrorAlert messages={errorMessages(mutation.error)} />}

      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending || noCategories}>
          {mutation.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {isEdit ? 'Salvar' : 'Cadastrar'}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}
