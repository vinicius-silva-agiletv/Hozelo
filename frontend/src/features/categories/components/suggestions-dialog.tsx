import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { ResponsiveDialog, ResponsiveDialogFooter } from '@/components/shared/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { pluralize } from '@/lib/format'
import type { CategoryType } from '@/types/api'

import { useCreateSuggestedCategories, type SuggestionsResult } from '../hooks'
import { categoryTypeLabels } from '../schemas'
import { categorySuggestions, sameName } from '../suggestions'

interface SuggestionsDialogProps {
  type: CategoryType | null
  existingNames: string[]
  onClose: () => void
}

/** Lista marcável de categorias comuns do tipo; cria só as marcadas (data-model.md SuggestionsForm). */
export function SuggestionsDialog({ type, existingNames, onClose }: SuggestionsDialogProps) {
  return (
    <ResponsiveDialog
      open={type !== null}
      onOpenChange={(open) => !open && onClose()}
      title={type ? `Sugestões de ${categoryTypeLabels[type].plural.toLowerCase()}` : 'Sugestões'}
      description="Desmarque as que a família não usa. Dá para renomear ou remover depois."
    >
      {type && <SuggestionsBody type={type} existingNames={existingNames} onDone={onClose} />}
    </ResponsiveDialog>
  )
}

const createdMessage = (count: number) => `${pluralize(count, 'categoria criada', 'categorias criadas')}.`

function SuggestionsBody({ type, existingNames, onDone }: { type: CategoryType; existingNames: string[]; onDone: () => void }) {
  const exists = (name: string) => existingNames.some((existing) => sameName(existing, name))
  const suggestions = categorySuggestions[type]
  const [selected, setSelected] = useState(() => new Set(suggestions.filter((name) => !exists(name))))
  const [failures, setFailures] = useState<SuggestionsResult['failures']>([])
  const createSuggested = useCreateSuggestedCategories()

  const toggle = (name: string, checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(name)
      else next.delete(name)
      return next
    })

  const onConfirm = () => {
    const names = suggestions.filter((name) => selected.has(name) && !exists(name))
    createSuggested.mutate(
      { type, names },
      {
        onSuccess: ({ created, failures: failed }) => {
          if (created.length > 0) toast.success(createdMessage(created.length))
          if (failed.length === 0) {
            onDone()
            return
          }
          setFailures(failed)
          setSelected(new Set(failed.map((failure) => failure.name)))
        },
      },
    )
  }

  const selectable = suggestions.filter((name) => selected.has(name) && !exists(name)).length

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-1 sm:grid-cols-2" aria-label="Sugestões">
        {suggestions.map((name) => {
          const id = `suggestion-${type}-${name}`
          const alreadyExists = exists(name)
          return (
            <li key={name} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60">
              <Checkbox
                id={id}
                checked={!alreadyExists && selected.has(name)}
                disabled={alreadyExists || createSuggested.isPending}
                onCheckedChange={(checked) => toggle(name, checked === true)}
              />
              <label htmlFor={id} className="flex flex-1 items-center justify-between gap-2 text-sm">
                <span>{name}</span>
                {alreadyExists && <span className="text-xs text-muted-foreground">já existe</span>}
              </label>
            </li>
          )
        })}
      </ul>

      {failures.length > 0 && (
        <ApiErrorAlert messages={failures.map((failure) => `${failure.name}: ${failure.messages.join(' ')}`)} />
      )}

      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={createSuggested.isPending}>
          Cancelar
        </Button>
        <Button type="button" onClick={onConfirm} disabled={selectable === 0 || createSuggested.isPending}>
          {createSuggested.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {selectable === 0 ? 'Criar categorias' : `Criar ${pluralize(selectable, 'categoria', 'categorias')}`}
        </Button>
      </ResponsiveDialogFooter>
    </div>
  )
}
