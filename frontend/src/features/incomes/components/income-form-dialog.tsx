import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { MoneyInput } from '@/components/shared/money-input'
import { NativeSelect } from '@/components/shared/native-select'
import { NoCategoriesAlert } from '@/components/shared/no-categories-alert'
import { OptionGroup } from '@/components/shared/option-group'
import { ResponsiveDialog, ResponsiveDialogFooter } from '@/components/shared/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useCategories } from '@/features/categories/hooks'
import { defaultFirstDueDate } from '@/features/expenses/preview'
import { RecurrenceFormBody } from '@/features/recurrences/components/recurrence-form-dialog'
import { errorMessages } from '@/lib/api'
import { todayIso } from '@/lib/date'
import { currentMonth } from '@/lib/month'
import type { RequestUpdateIncome, ResponseIncome } from '@/types/api'

import { useCreateIncome, useUpdateIncome } from '../hooks'
import { emptyIncomeForm, incomeSchema, incomeToForm, incomeToRequest, type IncomeForm } from '../schemas'

export type IncomeFormMode = { kind: 'create'; viewMonth: string | null } | { kind: 'edit'; income: ResponseIncome }

/** "Nova receita" em dois modos — Avulsa ou Todo mês (FR-004) — e edição da avulsa (FR-005). */
export function IncomeFormDialog({ mode, onClose }: { mode: IncomeFormMode | null; onClose: () => void }) {
  return (
    <ResponsiveDialog
      open={mode !== null}
      onOpenChange={(open) => !open && onClose()}
      title={mode?.kind === 'edit' ? 'Editar receita' : 'Nova receita'}
      description={mode?.kind === 'edit' ? undefined : 'Uma entrada única ou que se repete todo mês.'}
    >
      {mode?.kind === 'edit' && <IncomeFormBody mode={mode} onDone={onClose} />}
      {mode?.kind === 'create' && <CreateIncome viewMonth={mode.viewMonth} onDone={onClose} />}
    </ResponsiveDialog>
  )
}

function CreateIncome({ viewMonth, onDone }: { viewMonth: string | null; onDone: () => void }) {
  const [type, setType] = useState<'single' | 'monthly'>('single')
  return (
    <div className="flex flex-col gap-4">
      <OptionGroup
        name="income-type"
        legend="Tipo"
        value={type}
        options={[
          { value: 'single', label: 'Avulsa' },
          { value: 'monthly', label: 'Todo mês' },
        ]}
        onChange={setType}
      />
      {type === 'single' ? (
        <IncomeFormBody mode={{ kind: 'create', viewMonth }} onDone={onDone} />
      ) : (
        <RecurrenceFormBody mode={{ kind: 'create', entryKind: 'Income', viewMonth }} onDone={onDone} />
      )}
    </div>
  )
}

function IncomeFormBody({ mode, onDone }: { mode: IncomeFormMode; onDone: () => void }) {
  const isEdit = mode.kind === 'edit'
  const categories = useCategories('Income')
  const create = useCreateIncome()
  const update = useUpdateIncome(isEdit ? mode.income.id : 0)
  const mutation = isEdit ? update : create

  const form = useForm<IncomeForm>({
    resolver: zodResolver(incomeSchema),
    defaultValues: isEdit
      ? incomeToForm(mode.income, todayIso())
      : emptyIncomeForm(defaultFirstDueDate(mode.viewMonth ?? currentMonth(), todayIso()), todayIso()),
  })
  const { errors } = form.formState
  const [alreadyReceived] = useWatch({ control: form.control, name: ['alreadyReceived'] })
  const noCategories = categories.isSuccess && categories.data.length === 0

  const onSubmit = form.handleSubmit((values) => {
    const request = incomeToRequest(values)
    if (isEdit) {
      const updateRequest: RequestUpdateIncome = {
        name: request.name,
        categoryId: request.categoryId,
        amount: request.amount,
        expectedDate: request.expectedDate,
        notes: request.notes,
      }
      update.mutate(updateRequest, {
        onSuccess: () => {
          toast.success('Receita atualizada.')
          onDone()
        },
      })
    } else {
      create.mutate(request, {
        onSuccess: () => {
          toast.success('Receita cadastrada.')
          onDone()
        },
      })
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="income-name">Nome</FieldLabel>
          <Input id="income-name" autoComplete="off" maxLength={120} aria-invalid={!!errors.name} {...form.register('name')} />
          <FieldError errors={[errors.name]} />
        </Field>

        {noCategories ? (
          <NoCategoriesAlert type="Income" />
        ) : (
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <Field data-invalid={!!errors.categoryId}>
                <FieldLabel htmlFor="income-category">Categoria</FieldLabel>
                <NativeSelect
                  id="income-category"
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
          <Controller
            control={form.control}
            name="amount"
            render={({ field }) => (
              <Field data-invalid={!!errors.amount}>
                <FieldLabel htmlFor="income-amount">Valor</FieldLabel>
                <MoneyInput id="income-amount" value={field.value} onChange={field.onChange} aria-invalid={!!errors.amount} />
                <FieldError errors={[errors.amount]} />
              </Field>
            )}
          />
          <Field data-invalid={!!errors.expectedDate}>
            <FieldLabel htmlFor="income-date">Data prevista</FieldLabel>
            <Input id="income-date" type="date" min="2000-01-01" max="2100-12-31" aria-invalid={!!errors.expectedDate} {...form.register('expectedDate')} />
            <FieldError errors={[errors.expectedDate]} />
          </Field>
        </div>

        {!isEdit && (
          <Controller
            control={form.control}
            name="alreadyReceived"
            render={({ field }) => (
              <Field orientation="horizontal">
                <Switch id="income-received" checked={field.value} onCheckedChange={field.onChange} />
                <FieldLabel htmlFor="income-received" className="font-normal">
                  Já recebida
                </FieldLabel>
              </Field>
            )}
          />
        )}
        {!isEdit && alreadyReceived && (
          <Field data-invalid={!!errors.receivedOn}>
            <FieldLabel htmlFor="income-received-on">Recebida em</FieldLabel>
            <Input id="income-received-on" type="date" max={todayIso()} aria-invalid={!!errors.receivedOn} {...form.register('receivedOn')} />
            <FieldError errors={[errors.receivedOn]} />
          </Field>
        )}

        <Field data-invalid={!!errors.notes}>
          <FieldLabel htmlFor="income-notes">Observação (opcional)</FieldLabel>
          <Textarea id="income-notes" rows={2} aria-invalid={!!errors.notes} {...form.register('notes')} />
          <FieldError errors={[errors.notes]} />
        </Field>
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
