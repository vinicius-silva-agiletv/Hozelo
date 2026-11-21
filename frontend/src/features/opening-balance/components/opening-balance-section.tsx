import { PiggyBank } from 'lucide-react'
import { useState } from 'react'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessages } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

import { useOpeningBalance } from '../hooks'
import { OpeningBalanceFormDialog } from './opening-balance-form-dialog'

/** Seção Saldo inicial: ponto de partida do saldo acumulado no resumo do mês (FR-007..FR-009). */
export function OpeningBalanceSection() {
  const balance = useOpeningBalance()
  const [open, setOpen] = useState(false)

  let content
  if (balance.isPending) {
    content = <Skeleton className="h-16 w-full" aria-label="Carregando saldo inicial" />
  } else if (balance.isError) {
    content = (
      <ApiErrorAlert messages={errorMessages(balance.error)}>
        <Button variant="outline" size="sm" onClick={() => balance.refetch()}>Tentar novamente</Button>
      </ApiErrorAlert>
    )
  } else if (balance.data === null) {
    content = (
      <div className="space-y-3">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <PiggyBank className="mt-0.5 size-4 shrink-0" aria-hidden />
          Saldo inicial ainda não informado. Sem ele, o saldo acumulado começa do zero.
        </p>
        <Button onClick={() => setOpen(true)}>Informar saldo inicial</Button>
      </div>
    )
  } else {
    const negative = balance.data.amount < 0
    content = (
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            className={cn('font-heading text-2xl font-semibold tabular-nums', negative && 'text-destructive')}
            data-testid="opening-balance-amount"
          >
            {negative ? `−${formatCurrency(Math.abs(balance.data.amount))}` : formatCurrency(balance.data.amount)}
          </p>
          <p className="text-sm text-muted-foreground">em {formatDate(balance.data.referenceDate)}</p>
        </div>
        <Button variant="outline" onClick={() => setOpen(true)}>Alterar</Button>
      </div>
    )
  }

  return (
    <section aria-labelledby="opening-balance-title">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            <h2 id="opening-balance-title">Saldo inicial</h2>
          </CardTitle>
          <CardDescription>
            É o ponto de partida do saldo acumulado no resumo do mês: o que sobra (ou falta) de cada mês soma a ele.
          </CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
        <OpeningBalanceFormDialog open={open} current={balance.data ?? null} onClose={() => setOpen(false)} />
      </Card>
    </section>
  )
}
