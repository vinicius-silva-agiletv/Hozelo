import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'

import { NativeSelect } from '@/components/shared/native-select'
import { OptionGroup } from '@/components/shared/option-group'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { usePeople } from '@/features/people/hooks'
import { formatCurrency } from '@/lib/format'
import { fromCents } from '@/lib/money'
import type { PersonSplitValues } from '@/lib/person-split'

interface PersonSplitFieldsProps<T extends PersonSplitValues> {
  /** Prefixo dos ids dos campos (ex.: "expense"). */
  idPrefix: string
  control: Control<T>
  register: UseFormRegister<T>
  errors: FieldErrors<T>
  /** Valor de um período (parcela ou mês) em centavos, para mostrar a parte da pessoa. */
  periodCents: number | null
  /** "por parcela" ou "por mês". */
  periodLabel: string
}

/** "Dividir com uma pessoa" (features 007 e 008): pessoa já cadastrada e parte integral ou %. */
export function PersonSplitFields<T extends PersonSplitValues>(props: PersonSplitFieldsProps<T>) {
  // Os campos são sempre os de PersonSplitValues; o tipo do formulário completo só importa para quem chama.
  const control = props.control as unknown as Control<PersonSplitValues>
  const register = props.register as unknown as UseFormRegister<PersonSplitValues>
  const errors = props.errors as FieldErrors<PersonSplitValues>
  const { idPrefix, periodCents, periodLabel } = props

  const people = usePeople()
  const [split, personId, shareMode, percent] = useWatch({
    control,
    name: ['splitWithPerson', 'personId', 'shareMode', 'personPercent'],
  })
  const noPeople = people.isSuccess && people.data.length === 0

  const person = people.data?.find((p) => p.id === personId)
  const sharePercent = shareMode === 'full' ? 100 : percent
  const shareText =
    person && periodCents !== null && periodCents > 0 && sharePercent && sharePercent >= 1 && sharePercent <= 100
      ? `Parte de ${person.name}: ${formatCurrency(fromCents(Math.round((periodCents * sharePercent) / 100)))} ${periodLabel}`
      : null

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <Controller
        control={control}
        name="splitWithPerson"
        render={({ field }) => (
          <Field orientation="horizontal">
            <Switch id={`${idPrefix}-split`} checked={field.value} disabled={noPeople} onCheckedChange={field.onChange} />
            <FieldLabel htmlFor={`${idPrefix}-split`} className="font-normal">
              Dividir com uma pessoa
            </FieldLabel>
          </Field>
        )}
      />
      {noPeople && <FieldDescription>Cadastre pessoas na área Pessoas para dividir despesas.</FieldDescription>}

      {split && !noPeople && (
        <div className="space-y-3">
          <Controller
            control={control}
            name="personId"
            render={({ field }) => (
              <Field data-invalid={!!errors.personId}>
                <FieldLabel htmlFor={`${idPrefix}-person`}>Pessoa</FieldLabel>
                <NativeSelect
                  id={`${idPrefix}-person`}
                  value={field.value ?? ''}
                  aria-invalid={!!errors.personId}
                  onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : null)}
                >
                  <option value="">Escolha...</option>
                  {people.data?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </NativeSelect>
                <FieldError errors={[errors.personId]} />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="shareMode"
            render={({ field }) => (
              <OptionGroup
                name={`${idPrefix}-share`}
                legend="Parte da pessoa"
                value={field.value}
                options={[
                  { value: 'full', label: 'Integral' },
                  { value: 'percent', label: 'Percentual' },
                ]}
                onChange={field.onChange}
              />
            )}
          />
          {shareMode === 'percent' && (
            <Field data-invalid={!!errors.personPercent}>
              <FieldLabel htmlFor={`${idPrefix}-percent`}>Percentual (%)</FieldLabel>
              <Input
                id={`${idPrefix}-percent`}
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                aria-invalid={!!errors.personPercent}
                {...register('personPercent', { setValueAs: (value: string) => (value === '' ? null : Number(value)) })}
              />
              <FieldError errors={[errors.personPercent]} />
            </Field>
          )}
          {shareText && <p className="text-sm text-muted-foreground">{shareText}</p>}
        </div>
      )}
    </div>
  )
}
