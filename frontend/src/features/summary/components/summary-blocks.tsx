import { Info } from 'lucide-react'
import { Link } from 'react-router'

import { NativeSelect } from '@/components/shared/native-select'
import { useCategories } from '@/features/categories/hooks'
import { formatCurrency } from '@/lib/format'
import { formatMonth } from '@/lib/month'
import { cn } from '@/lib/utils'
import type { ResponseMonthlySummary } from '@/types/api'

import type { Hero } from '../ledger'
import { LedgerRow } from './ledger-list'

const signed = (value: number) => cn('tabular-nums', value < 0 && 'text-destructive')

/** Destaque principal (clarify Q1, FR-003, FR-004). */
export function SummaryHero({ hero }: { hero: Hero }) {
  if (hero.kind === 'accumulated') {
    return (
      <section aria-labelledby="hero-title" className="rounded-2xl border bg-muted/40 p-4 sm:p-5">
        <h2 id="hero-title" className="text-sm text-muted-foreground">Saldo no fim do mês</h2>
        <p className={cn('font-heading text-3xl font-semibold sm:text-4xl', signed(hero.value))} data-testid="hero-value">
          {formatCurrency(hero.value)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {`veio de ${formatMonth(hero.previousMonth)} `}
          <span className={signed(hero.previous)}>{formatCurrency(hero.previous)}</span>
          {' · saldo do mês '}
          <span className={signed(hero.monthBalance)}>{formatCurrency(hero.monthBalance)}</span>
          {hero.pendingNet !== null && (
            <>
              {' · pendências de meses anteriores '}
              <span className={signed(hero.pendingNet)}>{formatCurrency(hero.pendingNet)}</span>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {hero.projection
            ? 'Projeção de fechamento: conta o que ainda vai entrar e sair até o fim do mês.'
            : 'Fechamento realizado: usa o que de fato entrou e saiu no mês.'}
        </p>
      </section>
    )
  }
  return (
    <section aria-labelledby="hero-title" className="rounded-2xl border bg-muted/40 p-4 sm:p-5">
      <h2 id="hero-title" className="text-sm text-muted-foreground">Saldo previsto do mês</h2>
      <p className={cn('font-heading text-3xl font-semibold sm:text-4xl', signed(hero.value))} data-testid="hero-value">
        {formatCurrency(hero.value)}
      </p>
      <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {hero.reason === 'missing' && (
          <span>
            Informe o saldo inicial para ver quanto vai sobrar no fim do mês.{' '}
            <Link to="/configuracoes" className="font-medium text-foreground underline underline-offset-4">
              Informar saldo inicial
            </Link>
          </span>
        )}
        {hero.reason === 'filtered' && <span>O saldo acumulado vale só para a família inteira (sem filtro de categoria).</span>}
        {hero.reason === 'beforeStart' && <span>O acompanhamento do saldo começa no mês do saldo inicial.</span>}
      </p>
    </section>
  )
}

/** Cartões de previsto e realizado (FR-001). */
export function SummaryTotals({ summary }: { summary: ResponseMonthlySummary }) {
  const groups = [
    {
      title: 'Previsto',
      rows: [
        ['Entradas', summary.forecast.incomes],
        ['Saídas', summary.forecast.expenses],
        ['Saldo', summary.forecast.balance],
      ],
    },
    {
      title: 'Realizado',
      rows: [
        ['Recebido', summary.realized.received],
        ['Pago', summary.realized.paid],
        ['Saldo', summary.realized.balance],
      ],
    },
  ] as const
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {groups.map((group) => (
        <section key={group.title} aria-label={group.title} className="rounded-xl border p-3">
          <h2 className="mb-1 text-sm font-medium">{group.title}</h2>
          <dl className="space-y-1 text-sm">
            {group.rows.map(([label, value]) => (
              <div key={label} className={cn('flex justify-between gap-3', label === 'Saldo' && 'border-t pt-1 font-medium')}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className={label === 'Saldo' ? signed(value) : 'tabular-nums'}>{formatCurrency(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}

/** Pendências de meses anteriores (US3, FR-005, FR-006): só no mês atual, da API. */
export function PendingSection({ pending }: { pending: ResponseMonthlySummary['pending'] }) {
  if (!pending || pending.items.length === 0) return null
  return (
    <section aria-labelledby="pending-title" className="space-y-2 rounded-xl border border-amber-500/40 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="pending-title" className="font-medium">Pendências de meses anteriores</h2>
        <p className="text-sm">
          <span className="text-muted-foreground">A pagar </span>
          <span className="tabular-nums">{formatCurrency(pending.toPay)}</span>
          <span className="text-muted-foreground"> · A receber </span>
          <span className="tabular-nums">{formatCurrency(pending.toReceive)}</span>
        </p>
      </div>
      <ul aria-label="Pendências de meses anteriores" className="divide-y rounded-lg border">
        {pending.items.map((item) => (
          <LedgerRow key={`${item.source}-${item.sourceId}-${item.number ?? ''}-${item.month}`} item={item} showMonth />
        ))}
      </ul>
    </section>
  )
}

/** Filtro por categoria com grupos Despesas e Receitas (research.md §7). */
export function SummaryCategoryFilter({ value, onChange }: { value: number | null; onChange: (id: number | null) => void }) {
  const expenses = useCategories('Expense')
  const incomes = useCategories('Income')
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="summary-category" className="text-sm text-muted-foreground">
        Categoria
      </label>
      <NativeSelect id="summary-category" className="w-44" value={value ?? ''} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}>
        <option value="">Todas</option>
        <optgroup label="Despesas">
          {expenses.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Receitas">
          {incomes.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </optgroup>
      </NativeSelect>
    </div>
  )
}

