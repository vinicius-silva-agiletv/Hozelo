import { NativeSelect } from '@/components/shared/native-select'
import { useCategories } from '@/features/categories/hooks'

interface CategoryFilterProps {
  id: string
  value: number | null
  onChange: (categoryId: number | null) => void
}

/** Filtro por categoria de despesa ("Todas" = sem filtro). */
export function CategoryFilter({ id, value, onChange }: CategoryFilterProps) {
  const categories = useCategories('Expense')
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        Categoria
      </label>
      <NativeSelect
        id={id}
        className="w-44"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      >
        <option value="">Todas</option>
        {categories.data?.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </NativeSelect>
    </div>
  )
}
