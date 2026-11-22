import { Link } from 'react-router'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessages } from '@/lib/api'
import { formatBalance, formatCurrency } from '@/lib/format'
import type { ResponsePersonOrigin, ResponsePersonOverview } from '@/types/api'

import { originLabel, originLink } from './charge-labels'

interface OverviewViewProps {
  overview: { data?: ResponsePersonOverview; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown }
}

/** Resumo geral por origem (US5, FR-006): valores da API. */
export function OverviewView({ overview }: OverviewViewProps) {
  if (overview.isPending) return <Skeleton className="h-40 w-full" aria-label="Carregando resumo" />
  if (overview.isError || !overview.data) {
    return (
      <ApiErrorAlert messages={errorMessages(overview.error)}>
        <Button variant="outline" size="sm" onClick={() => overview.refetch()}>Tentar novamente</Button>
      </ApiErrorAlert>
    )
  }
  const data = overview.data
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Totais da pessoa">
        <Total label="Deve até hoje" value={formatBalance(data.owedUntilNow)} />
        <Total label="Deve no total" value={formatBalance(data.owedTotal)} />
        {data.unallocatedCredit > 0 && <Total label="Crédito não usado" value={formatCurrency(data.unallocatedCredit)} />}
      </dl>
      {data.origins.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma cobrança para esta pessoa.</p>
      ) : (
        <ul aria-label="Origens" className="divide-y rounded-xl border">
          {data.origins.map((origin) => (
            <OriginRow key={`${origin.originType}-${origin.originId}`} origin={origin} />
          ))}
        </ul>
      )}
    </div>
  )
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border px-2 py-2 sm:px-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-heading text-sm font-semibold tabular-nums break-words sm:text-lg">{value}</dd>
    </div>
  )
}

function OriginRow({ origin }: { origin: ResponsePersonOrigin }) {
  const link = originLink(origin.originType, origin.originId)
  const body = (
    <span className="flex w-full flex-col gap-1 text-sm">
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate font-medium">{origin.description}</span>
          <span className="text-xs text-muted-foreground">
            {originLabel[origin.originType]}
            {' · '}
            {origin.isOpenEnded && origin.monthlyAmount !== null
              ? `${formatCurrency(origin.monthlyAmount)} por mês · sem fim`
              : `${origin.chargesDue} de ${origin.chargesTotal} vencidas`}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-medium tabular-nums">{`falta ${formatCurrency(origin.remaining)}`}</span>
        </span>
      </span>
      <span className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
        <span>{`Total ${formatCurrency(origin.total)}`}</span>
        <span>{`Pago ${formatCurrency(origin.paid)}`}</span>
      </span>
    </span>
  )
  return (
    <li className="px-3 py-2">
      {link ? (
        <Link to={link} aria-label={`Abrir ${origin.description}`} className="block rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  )
}
