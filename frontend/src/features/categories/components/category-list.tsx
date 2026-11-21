import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { pluralize } from '@/lib/format'
import type { ResponseCategory } from '@/types/api'

interface CategoryListProps {
  label: string
  categories: ResponseCategory[]
  onRename: (category: ResponseCategory) => void
  onDelete: (category: ResponseCategory) => void
}

/** Categorias em ordem alfabética, com a quantidade de lançamentos e o menu de ações. */
export function CategoryList({ label, categories, onRename, onDelete }: CategoryListProps) {
  return (
    <ul aria-label={label} className="divide-y rounded-xl border">
      {categories.map((category) => (
        <li key={category.id} className="flex items-center gap-3 py-2 pr-2 pl-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium" title={category.name}>{category.name}</p>
            <p className="text-sm text-muted-foreground">
              {pluralize(category.entriesCount, 'lançamento', 'lançamentos', 'Nenhum lançamento')}
            </p>
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Ações de ${category.name}`}>
                <EllipsisVertical aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onRename(category)}>
                <Pencil aria-hidden />
                Renomear
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(category)}>
                <Trash2 aria-hidden />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      ))}
    </ul>
  )
}
