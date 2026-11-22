import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { ResponsiveDialog, ResponsiveDialogFooter } from '@/components/shared/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { errorMessages } from '@/lib/api'
import type { ResponsePerson } from '@/types/api'

import { useCreatePerson, useDeletePerson, useRenamePerson } from '../hooks'
import { personSchema, type PersonForm } from '../schemas'

export type PersonFormMode = { kind: 'create' } | { kind: 'rename'; person: ResponsePerson }

/** Cadastrar ou renomear uma pessoa (FR-002). */
export function PersonFormDialog({ mode, onClose }: { mode: PersonFormMode | null; onClose: () => void }) {
  return (
    <ResponsiveDialog
      open={mode !== null}
      onOpenChange={(open) => !open && onClose()}
      title={mode?.kind === 'rename' ? 'Renomear pessoa' : 'Nova pessoa'}
      description={mode?.kind === 'rename' ? undefined : 'Quem divide despesas com a família.'}
    >
      {mode && <PersonFormBody mode={mode} onDone={onClose} />}
    </ResponsiveDialog>
  )
}

function PersonFormBody({ mode, onDone }: { mode: PersonFormMode; onDone: () => void }) {
  const create = useCreatePerson()
  const rename = useRenamePerson(mode.kind === 'rename' ? mode.person.id : 0)
  const mutation = mode.kind === 'rename' ? rename : create
  const form = useForm<PersonForm>({
    resolver: zodResolver(personSchema),
    defaultValues: { name: mode.kind === 'rename' ? mode.person.name : '' },
  })
  const error = form.formState.errors.name

  const onSubmit = form.handleSubmit(({ name }) =>
    mutation.mutate(name, {
      onSuccess: () => {
        toast.success(mode.kind === 'rename' ? 'Pessoa renomeada.' : 'Pessoa cadastrada.')
        onDone()
      },
    }),
  )

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field data-invalid={!!error}>
        <FieldLabel htmlFor="person-name">Nome</FieldLabel>
        <Input id="person-name" autoComplete="off" autoFocus maxLength={120} aria-invalid={!!error} {...form.register('name')} />
        <FieldError errors={[error]} />
      </Field>
      {mutation.isError && <ApiErrorAlert messages={errorMessages(mutation.error)} />}
      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {mode.kind === 'rename' ? 'Salvar' : 'Cadastrar'}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}

/** Remover pessoa com confirmação; a recusa da API (com lançamentos) aparece no diálogo. */
export function DeletePersonDialog({ person, onClose, onDeleted }: { person: ResponsePerson | null; onClose: () => void; onDeleted?: () => void }) {
  const remove = useDeletePerson()
  const close = () => {
    remove.reset()
    onClose()
  }
  return (
    <ConfirmDialog
      open={person !== null}
      onOpenChange={(open) => !open && close()}
      title="Remover pessoa?"
      description={person ? `"${person.name}" será removida. Só é possível remover quem não tem cobranças, pagamentos ou despesas.` : undefined}
      confirmLabel="Remover"
      destructive
      pending={remove.isPending}
      onConfirm={() =>
        person &&
        remove.mutate(person.id, {
          onSuccess: () => {
            toast.success('Pessoa removida.')
            close()
            onDeleted?.()
          },
        })
      }
    >
      {remove.isError && <ApiErrorAlert messages={errorMessages(remove.error)} />}
    </ConfirmDialog>
  )
}

export interface DeleteEntryTarget {
  title: string
  description: string
  successMessage: string
  onConfirm: () => Promise<unknown>
}

/** Remover pagamento ou cobrança avulsa, com a recusa da API no diálogo. */
export function DeleteEntryDialog({ target, onClose }: { target: DeleteEntryTarget | null; onClose: () => void }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const close = () => {
    setError(null)
    onClose()
  }
  return (
    <ConfirmDialog
      open={target !== null}
      onOpenChange={(open) => !open && !pending && close()}
      title={target?.title ?? ''}
      description={target?.description}
      confirmLabel="Remover"
      destructive
      pending={pending}
      onConfirm={async () => {
        if (!target) return
        setPending(true)
        setError(null)
        try {
          await target.onConfirm()
          toast.success(target.successMessage)
          close()
        } catch (caught) {
          setError(caught)
        } finally {
          setPending(false)
        }
      }}
    >
      {error !== null && <ApiErrorAlert messages={errorMessages(error)} />}
    </ConfirmDialog>
  )
}
