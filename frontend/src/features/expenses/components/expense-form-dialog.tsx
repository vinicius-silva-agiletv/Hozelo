import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm, useWatch, type Control } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { MoneyInput } from '@/components/shared/money-input'
import { PersonSplitFields } from '@/components/shared/person-split-fields'
import { NativeSelect } from '@/components/shared/native-select'
import { ResponsiveDialog, ResponsiveDialogFooter } from '@/components/shared/responsive-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCategories } from '@/features/categories/hooks'
import { errorMessages } from '@/lib/api'
import { isValidIsoDate, todayIso } from '@/lib/date'
import { formatCurrency, formatDate } from '@/lib/format'
import { fromCents, toCents } from '@/lib/money'
import { currentMonth } from '@/lib/month'
import type { RequestUpdateExpense, ResponseExpense } from '@/types/api'

import { useCreateExpense, useUpdateExpense } from '../hooks'
import { defaultFirstDueDate, expenseSummary, suggestedPaidCount } from '../preview'
import { emptyExpenseForm, expenseSchema, expenseToForm, formToRequest, type ExpenseForm } from '../schemas'
import { OptionGroup } from '@/components/shared/option-group'

export type ExpenseFormMode = { kind: 'create'; viewMonth: string | null } | { kind: 'edit'; expense: ResponseExpense }

/** Cadastrar ou editar uma despesa (US3, US4, US6; FR-007..FR-009, FR-013, FR-018). */
export function ExpenseFormDialog({ mode, onClose }: { mode: ExpenseFormMode | null; onClose: () => void }) {
  return (
    <ResponsiveDialog
      open={mode !== null}
      onOpenChange={(open) => !open && onClose()}
      title={mode?.kind === 'edit' ? 'Editar despesa' : 'Nova despesa'}
      description={mode?.kind === 'edit' ? 'As parcelas são recalculadas mantendo as já pagas.' : 'Conta ou compra, à vista ou parcelada.'}
    >
      {mode && <ExpenseFormBody mode={mode} onDone={onClose} />}
    </ResponsiveDialog>
  )
}

const numberOrNaN = (value: string) => (value === '' ? Number.NaN : Number(value))

function ExpenseFormBody({ mode, onDone }: { mode: ExpenseFormMode; onDone: () => void }) {
  const isEdit = mode.kind === 'edit'
  const categories = useCategories('Expense')
  const create = useCreateExpense()
  const update = useUpdateExpense(isEdit ? mode.expense.id : 0)
  const mutation = isEdit ? update : create

  const form = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: isEdit
      ? expenseToForm(mode.expense)
      : emptyExpenseForm(defaultFirstDueDate(mode.viewMonth ?? currentMonth(), todayIso())),
  })
  const { errors, dirtyFields } = form.formState
  const [isInstallment, firstDueDate, installmentsCount, amountType] = useWatch({
    control: form.control,
    name: ['isInstallment', 'firstDueDate', 'installmentsCount', 'amountType'],
  })

  // Sugestão de parcelas já pagas (clarify Q3): acompanha data e quantidade até a família editar.
  const paidTouched = !!dirtyFields.alreadyPaidInstallments
  useEffect(() => {
    if (isEdit || paidTouched || !isValidIsoDate(firstDueDate)) return
    const count = isInstallment ? installmentsCount : 1
    if (!Number.isInteger(count) || count < 1) return
    form.setValue('alreadyPaidInstallments', suggestedPaidCount(firstDueDate, count, todayIso()))
  }, [form, isEdit, paidTouched, firstDueDate, installmentsCount, isInstallment])

  const onSubmit = form.handleSubmit((values) => {
    const request = formToRequest(values)
    if (isEdit) {
      const updateRequest: Partial<typeof request> = { ...request }
      delete updateRequest.alreadyPaidInstallments
      update.mutate(updateRequest as RequestUpdateExpense, {
        onSuccess: () => {
          toast.success('Despesa atualizada.')
          onDone()
        },
      })
    } else {
      create.mutate(request, {
        onSuccess: () => {
          toast.success('Despesa cadastrada.')
          onDone()
        },
      })
    }
  })

  const noCategories = categories.isSuccess && categories.data.length === 0
  const [watchedAmount] = useWatch({ control: form.control, name: ['amount'] })
  const periodCount = isInstallment ? installmentsCount : 1
  const periodCents =
    watchedAmount > 0 && Number.isInteger(periodCount) && periodCount >= 1
      ? isInstallment && amountType === 'Installment'
        ? toCents(watchedAmount)
        : Math.floor(toCents(watchedAmount) / periodCount)
      : null

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="expense-name">Nome</FieldLabel>
          <Input id="expense-name" autoComplete="off" maxLength={120} aria-invalid={!!errors.name} {...form.register('name')} />
          <FieldError errors={[errors.name]} />
        </Field>

        {noCategories ? (
          <Alert>
            <Info aria-hidden />
            <AlertDescription>
              Crie uma categoria de despesa antes de cadastrar.{' '}
              <Link to="/configuracoes" className="font-medium text-foreground underline underline-offset-4">
                Ir para Configurações
              </Link>
            </AlertDescription>
          </Alert>
        ) : (
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <Field data-invalid={!!errors.categoryId}>
                <FieldLabel htmlFor="expense-category">Categoria</FieldLabel>
                <NativeSelect
                  id="expense-category"
                  value={field.value ?? ''}
                  aria-invalid={!!errors.categoryId}
                  onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : null)}
                  onBlur={field.onBlur}
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

        <Controller
          control={form.control}
          name="isInstallment"
          render={({ field }) => (
            <OptionGroup
              name="expense-installment"
              legend="Pagamento"
              value={field.value ? 'parcelado' : 'avista'}
              options={[
                { value: 'avista', label: 'À vista' },
                { value: 'parcelado', label: 'Parcelado' },
              ]}
              onChange={(value) => field.onChange(value === 'parcelado')}
            />
          )}
        />

        {isInstallment && (
          <Controller
            control={form.control}
            name="amountType"
            render={({ field }) => (
              <OptionGroup
                name="expense-amount-type"
                legend="Valor informado"
                value={field.value}
                options={[
                  { value: 'Total', label: 'Valor total' },
                  { value: 'Installment', label: 'Valor da parcela' },
                ]}
                onChange={field.onChange}
              />
            )}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="amount"
            render={({ field }) => (
              <Field data-invalid={!!errors.amount}>
                <FieldLabel htmlFor="expense-amount">
                  {isInstallment && amountType === 'Installment' ? 'Valor da parcela' : 'Valor'}
                </FieldLabel>
                <MoneyInput id="expense-amount" value={field.value} onChange={field.onChange} onBlur={field.onBlur} aria-invalid={!!errors.amount} />
                <FieldError errors={[errors.amount]} />
              </Field>
            )}
          />
          {isInstallment && (
            <Field data-invalid={!!errors.installmentsCount}>
              <FieldLabel htmlFor="expense-count">Parcelas</FieldLabel>
              <Input
                id="expense-count"
                type="number"
                inputMode="numeric"
                min={2}
                max={480}
                aria-invalid={!!errors.installmentsCount}
                {...form.register('installmentsCount', { setValueAs: numberOrNaN })}
              />
              <FieldError errors={[errors.installmentsCount]} />
            </Field>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.firstDueDate}>
            <FieldLabel htmlFor="expense-first-due">{isInstallment ? 'Primeiro vencimento' : 'Vencimento'}</FieldLabel>
            <Input id="expense-first-due" type="date" min="2000-01-01" max="2100-12-31" aria-invalid={!!errors.firstDueDate} {...form.register('firstDueDate')} />
            <FieldError errors={[errors.firstDueDate]} />
          </Field>
          {!isEdit && (
            <Field data-invalid={!!errors.alreadyPaidInstallments}>
              <FieldLabel htmlFor="expense-paid">Parcelas já pagas</FieldLabel>
              <Input
                id="expense-paid"
                type="number"
                inputMode="numeric"
                min={0}
                aria-invalid={!!errors.alreadyPaidInstallments}
                {...form.register('alreadyPaidInstallments', { setValueAs: numberOrNaN })}
              />
              <FieldError errors={[errors.alreadyPaidInstallments]} />
            </Field>
          )}
        </div>

        <Field data-invalid={!!errors.notes}>
          <FieldLabel htmlFor="expense-notes">Observação (opcional)</FieldLabel>
          <Textarea id="expense-notes" rows={2} aria-invalid={!!errors.notes} {...form.register('notes')} />
          <FieldError errors={[errors.notes]} />
        </Field>

        <PersonSplitFields
          idPrefix="expense"
          control={form.control}
          register={form.register}
          errors={errors}
          periodCents={periodCents}
          periodLabel="por parcela"
        />
      </FieldGroup>

      <ExpenseSummary control={form.control} showPaid={!isEdit} />

      {mutation.isError && <ApiErrorAlert messages={errorMessages(mutation.error)} />}

      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending || noCategories}>
          {mutation.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {isEdit ? 'Salvar' : 'Cadastrar despesa'}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}

/** Resumo calculado antes de salvar (FR-008); prévia com a mesma regra da API. */
function ExpenseSummary({ control, showPaid }: { control: Control<ExpenseForm>; showPaid: boolean }) {
  const [amount, amountType, isInstallment, installmentsCount, firstDueDate, alreadyPaid] = useWatch({
    control,
    name: ['amount', 'amountType', 'isInstallment', 'installmentsCount', 'firstDueDate', 'alreadyPaidInstallments'],
  })
  const count = isInstallment ? installmentsCount : 1
  if (!(amount > 0) || !isValidIsoDate(firstDueDate) || !Number.isInteger(count) || count < 1 || count > 480) return null

  const summary = expenseSummary({
    amountType: isInstallment ? amountType : 'Total',
    amountCents: toCents(amount),
    count,
    firstDueDate,
    alreadyPaid: Number.isInteger(alreadyPaid) ? alreadyPaid : 0,
  })

  return (
    <div className="space-y-0.5 rounded-lg bg-muted/60 px-3 py-2 text-sm" data-testid="expense-summary" aria-live="polite">
      {count === 1 ? (
        <p className="font-medium">{`À vista · ${formatCurrency(fromCents(summary.total))} em ${formatDate(firstDueDate)}`}</p>
      ) : (
        <>
          <p className="font-medium">
            {`${count} × ${formatCurrency(fromCents(summary.installment))} · última em ${formatDate(summary.lastDueDate)}`}
          </p>
          <p className="text-muted-foreground">{`Total ${formatCurrency(fromCents(summary.total))}`}</p>
          {summary.hasRemainder && (
            <p className="text-muted-foreground">{`A última parcela leva a sobra: ${formatCurrency(fromCents(summary.last))}`}</p>
          )}
        </>
      )}
      {showPaid && summary.paid > 0 && (
        <p className="text-muted-foreground">{`${summary.paid} ${summary.paid === 1 ? 'paga' : 'pagas'} · faltam ${summary.remaining}`}</p>
      )}
    </div>
  )
}
