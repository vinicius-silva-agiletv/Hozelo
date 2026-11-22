import { cn } from '@/lib/utils'

interface OptionGroupProps<T extends string> {
  name: string
  legend: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  disabled?: boolean
}

/** Grupo de opções exclusivas com botões lado a lado (rádios nativos, acessíveis por teclado). */
export function OptionGroup<T extends string>({ name, legend, value, options, onChange, disabled }: OptionGroupProps<T>) {
  return (
    <fieldset disabled={disabled} className="space-y-1.5">
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors',
              'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
              value === option.value ? 'border-primary bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
