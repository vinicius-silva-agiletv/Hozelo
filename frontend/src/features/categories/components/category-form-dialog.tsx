import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { ResponsiveDialog, ResponsiveDialogFooter } from '@/components/shared/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { errorMessages } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { CategoryType, ResponseCategory } from '@/types/api'

import { useCreateCategory, useRenameCategory } from '../hooks'
import { categorySchema, categoryTypeLabels, type CategoryForm } from '../schemas'

type Mode = { kind: 'create'; type: CategoryType } | { kind: 'rename'; category: ResponseCategory }

interface CategoryFormDialogProps {
  mode: Mode | null
  onClose: () => void
}

/** Criar (escolhendo o tipo) ou renomear (tipo fixo) uma categoria. */
export function CategoryFormDialog({ mode, onClose }: CategoryFormDialogProps) {
  return (
    <ResponsiveDialog
      open={mode !== null}
      onOpenChange={(open) => !open && onClose()}
      title={mode?.kind === 'rename' ? 'Renomear categoria' : 'Nova categoria'}
      description={mode?.kind === 'rename' ? 'O tipo da categoria não muda.' : 'Use para agrupar despesas ou receitas.'}
    >
      {mode && <CategoryFormBody mode={mode} onDone={onClose} />}
    </ResponsiveDialog>
  )
}

function CategoryFormBody({ mode, onDone }: { mode: Mode; onDone: () => void }) {
  const create = useCreateCategory()
  const rename = useRenameCategory()
  const mutation = mode.kind === 'create' ? create : rename
  const isRename = mode.kind === 'rename'

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: isRename
      ? { name: mode.category.name, type: mode.category.type }
      : { name: '', type: mode.type },
  })

  const onSubmit = form.handleSubmit((values) => {
    if (isRename) {
      rename.mutate(
        { id: mode.category.id, name: values.name },
        { onSuccess: () => { toast.success('Categoria renomeada.'); onDone() } },
      )
    } else {
      create.mutate(values, { onSuccess: () => { toast.success('Categoria criada.'); onDone() } })
    }
  })

  const nameError = form.formState.errors.name

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field data-invalid={!!nameError}>
        <FieldLabel htmlFor="category-name">Nome</FieldLabel>
        <Input
          id="category-name"
          autoComplete="off"
          autoFocus
          maxLength={60}
          aria-invalid={!!nameError}
          {...form.register('name')}
        />
        <FieldError errors={[nameError]} />
      </Field>

      <Controller
        control={form.control}
        name="type"
        render={({ field }) => (
          <FieldSet disabled={isRename}>
            <FieldLegend variant="label">Tipo</FieldLegend>
            <div className="grid grid-cols-2 gap-2">
              {(['Expense', 'Income'] as const).map((type) => (
                <label
                  key={type}
                  className={cn(
                    'flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                    field.value === type ? 'border-primary bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted',
                    isRename && 'cursor-not-allowed opacity-60',
                  )}
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={type}
                    checked={field.value === type}
                    onChange={() => field.onChange(type)}
                    className="sr-only"
                  />
                  {categoryTypeLabels[type].singular}
                </label>
              ))}
            </div>
          </FieldSet>
        )}
      />

      {mutation.isError && <ApiErrorAlert messages={errorMessages(mutation.error)} />}

      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {isRename ? 'Salvar' : 'Criar categoria'}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}
