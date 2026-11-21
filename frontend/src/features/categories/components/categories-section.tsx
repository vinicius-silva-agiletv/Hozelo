import { Plus, Sparkles, Tags } from 'lucide-react'
import { useState } from 'react'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { errorMessages } from '@/lib/api'
import type { CategoryType, ResponseCategory } from '@/types/api'

import { useCategories } from '../hooks'
import { categoryTypeLabels } from '../schemas'
import { CategoryFormDialog } from './category-form-dialog'
import { CategoryList } from './category-list'
import { DeleteCategoryDialog } from './delete-category-dialog'
import { SuggestionsDialog } from './suggestions-dialog'

const TYPES: CategoryType[] = ['Expense', 'Income']

/** Seção Categorias: abas Despesas/Receitas com listar, criar, sugestões, renomear e remover. */
export function CategoriesSection() {
  const [type, setType] = useState<CategoryType>('Expense')

  return (
    <section aria-labelledby="categories-title" className="space-y-4">
      <div className="space-y-1">
        <h2 id="categories-title" className="font-heading text-lg font-semibold">Categorias</h2>
        <p className="text-sm text-muted-foreground">Agrupam as despesas e receitas no resumo do mês.</p>
      </div>

      <Tabs value={type} onValueChange={(value) => setType(value as CategoryType)}>
        <TabsList>
          {TYPES.map((item) => (
            <TabsTrigger key={item} value={item}>{categoryTypeLabels[item].plural}</TabsTrigger>
          ))}
        </TabsList>
        {TYPES.map((item) => (
          <TabsContent key={item} value={item} className="pt-2">
            <CategoryTypePanel type={item} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}

type Dialog =
  | { kind: 'create' }
  | { kind: 'suggestions' }
  | { kind: 'rename'; category: ResponseCategory }
  | { kind: 'delete'; category: ResponseCategory }
  | null

function CategoryTypePanel({ type }: { type: CategoryType }) {
  const categories = useCategories(type)
  const [dialog, setDialog] = useState<Dialog>(null)
  const close = () => setDialog(null)
  const label = categoryTypeLabels[type].plural

  const actions = (
    <>
      <Button onClick={() => setDialog({ kind: 'create' })}>
        <Plus aria-hidden />
        Nova categoria
      </Button>
      <Button variant="outline" onClick={() => setDialog({ kind: 'suggestions' })}>
        <Sparkles aria-hidden />
        Usar sugestões
      </Button>
    </>
  )

  let content
  if (categories.isPending) {
    content = (
      <div className="space-y-2" aria-busy="true" aria-label={`Carregando ${label.toLowerCase()}`}>
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    )
  } else if (categories.isError) {
    content = (
      <ApiErrorAlert messages={errorMessages(categories.error)}>
        <Button variant="outline" size="sm" onClick={() => categories.refetch()}>Tentar novamente</Button>
      </ApiErrorAlert>
    )
  } else if (categories.data.length === 0) {
    content = (
      <EmptyState
        icon={Tags}
        title={`Nenhuma categoria de ${categoryTypeLabels[type].singular.toLowerCase()}`}
        description="Crie as suas ou comece pelas sugestões mais comuns."
        action={<div className="flex flex-wrap justify-center gap-2">{actions}</div>}
      />
    )
  } else {
    content = (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">{actions}</div>
        <CategoryList
          label={label}
          categories={categories.data}
          onRename={(category) => setDialog({ kind: 'rename', category })}
          onDelete={(category) => setDialog({ kind: 'delete', category })}
        />
      </div>
    )
  }

  return (
    <>
      {content}
      <CategoryFormDialog
        mode={
          dialog?.kind === 'create' ? { kind: 'create', type }
          : dialog?.kind === 'rename' ? { kind: 'rename', category: dialog.category }
          : null
        }
        onClose={close}
      />
      <SuggestionsDialog
        type={dialog?.kind === 'suggestions' ? type : null}
        existingNames={categories.data?.map((category) => category.name) ?? []}
        onClose={close}
      />
      <DeleteCategoryDialog category={dialog?.kind === 'delete' ? dialog.category : null} onClose={close} />
    </>
  )
}
