import { formatCurrency } from '@/lib/format'
import { formatMonth } from '@/lib/month'
import type { ResponseShortRecurrence } from '@/types/api'

/** Contas encerradas antes do mês escolhido (FR-006); o detalhe permite reabrir. */
export function EndedFixedBills({ recurrences, onOpen }: { recurrences: ResponseShortRecurrence[]; onOpen: (id: number) => void }) {
  if (recurrences.length === 0) return null
  return (
    <section aria-labelledby="ended-title" className="space-y-2">
      <h2 id="ended-title" className="text-sm font-medium text-muted-foreground">
        Encerradas
      </h2>
      <ul aria-label="Contas fixas encerradas" className="divide-y rounded-xl border">
        {recurrences.map((recurrence) => (
          <li key={recurrence.id}>
            <button
              type="button"
              onClick={() => onOpen(recurrence.id)}
              aria-label={`Abrir ${recurrence.name}`}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-muted-foreground">{recurrence.name}</span>
                <span className="text-xs text-muted-foreground">{`encerrada em ${formatMonth(recurrence.endMonth!)}`}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{formatCurrency(recurrence.currentAmount)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
