import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import { formatMonth } from '@/lib/month'
import { cn } from '@/lib/utils'
import type { ResponseLedgerItem } from '@/types/api'

import { ledgerLabel, ledgerLink, ledgerShownAmount } from '../ledger'
import { LedgerToggle } from './ledger-toggle'

/** Item do resumo: caixa, data, nome com link para o detalhe, categoria/marcas e valor (FR-007, FR-008). */
export function LedgerRow({ item, showMonth = false }: { item: ResponseLedgerItem; showMonth?: boolean }) {
  const amount = ledgerShownAmount(item)
  const label = ledgerLabel(item)
  return (
    <li className="flex items-center gap-3 py-2 pr-3 pl-3">
      <LedgerToggle item={item} />
      <Link
        to={ledgerLink(item)}
        aria-label={`Abrir ${label}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="w-11 shrink-0 text-sm text-muted-foreground tabular-nums">{formatDate(item.date).slice(0, 5)}</span>
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate font-medium', item.isSettled && !amount.of && 'text-muted-foreground')}>
            {showMonth ? `${label} · ${formatMonth(item.month)}` : label}
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {item.category ? <span>{item.category.name}</span> : <Badge variant="secondary">reembolso</Badge>}
            {item.paidInAdvance && <Badge variant="secondary">antecipada</Badge>}
          </span>
        </span>
        <span className={cn('shrink-0 text-right font-medium tabular-nums', item.isSettled && !amount.of && 'text-muted-foreground')}>
          {amount.value}
          {amount.of && <span className="block text-xs font-normal text-muted-foreground">{amount.of}</span>}
        </span>
      </Link>
    </li>
  )
}

export function LedgerList({ label, items, empty }: { label: string; items: ResponseLedgerItem[]; empty: string }) {
  if (items.length === 0) return <p className="rounded-xl border px-3 py-4 text-sm text-muted-foreground">{empty}</p>
  return (
    <ul aria-label={label} className="divide-y rounded-xl border">
      {items.map((item) => (
        <LedgerRow key={`${item.source}-${item.sourceId}-${item.number ?? ''}-${item.month}`} item={item} />
      ))}
    </ul>
  )
}
