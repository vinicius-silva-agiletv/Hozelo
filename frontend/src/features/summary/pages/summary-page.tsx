import { CalendarRange } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { EmptyState } from '@/components/shared/empty-state'
import { MonthPicker } from '@/components/shared/month-picker'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { errorMessages } from '@/lib/api'
import { useDocumentTitle } from '@/lib/use-document-title'
import { useMonthUrl } from '@/lib/use-month-url'

import { LedgerList } from '../components/ledger-list'
import { PendingSection, SummaryCategoryFilter, SummaryHero, SummaryTotals } from '../components/summary-blocks'
import { useKnownCategory, useMonthlySummary } from '../hooks'
import { heroOf } from '../ledger'

type ListTab = 'entradas' | 'saidas'

/** Resumo do mês (/): quanto sobra no mês e no fim dele (US1–US4). */
export function SummaryPage() {
  useDocumentTitle('Resumo do mês')
  const url = useMonthUrl()
  const categoryId = useKnownCategory(url.categoryId)
  const [search, setSearch] = useSearchParams()
  const tab: ListTab = search.get('lista') === 'saidas' ? 'saidas' : 'entradas'
  const summary = useMonthlySummary(url.month, categoryId)

  const setTab = (next: ListTab) =>
    setSearch(
      (current) => {
        const copy = new URLSearchParams(current)
        if (next === 'entradas') copy.delete('lista')
        else copy.set('lista', next)
        return copy
      },
      { replace: true },
    )

  let content
  if (summary.isPending) {
    content = (
      <div className="space-y-3" aria-busy="true" aria-label="Carregando resumo">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  } else if (summary.isError) {
    content = (
      <ApiErrorAlert messages={errorMessages(summary.error)}>
        <Button variant="outline" size="sm" onClick={() => summary.refetch()}>Tentar novamente</Button>
      </ApiErrorAlert>
    )
  } else {
    const data = summary.data
    const empty = data.incomes.length === 0 && data.expenses.length === 0 && !data.pending?.items.length
    content = (
      <div className="space-y-4">
        <SummaryHero hero={heroOf(data, url.month, categoryId)} />
        <SummaryTotals summary={data} />
        <PendingSection pending={data.pending} />
        {empty ? (
          <EmptyState
            icon={CalendarRange}
            title="Nada lançado neste mês"
            description="Cadastre as despesas e receitas da família para acompanhar o mês."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild variant="outline">
                  <Link to="/despesas">Ir para Despesas</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/receitas">Ir para Receitas</Link>
                </Button>
              </div>
            }
          />
        ) : (
          <Tabs value={tab} onValueChange={(value) => setTab(value as ListTab)}>
            <TabsList>
              <TabsTrigger value="entradas">Entradas</TabsTrigger>
              <TabsTrigger value="saidas">Saídas</TabsTrigger>
            </TabsList>
            <TabsContent value="entradas" className="pt-2">
              <LedgerList label="Entradas" items={data.incomes} empty="Nenhuma entrada neste mês." />
            </TabsContent>
            <TabsContent value="saidas" className="pt-2">
              <LedgerList label="Saídas" items={data.expenses} empty="Nenhuma saída neste mês." />
            </TabsContent>
          </Tabs>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Resumo do mês" description="Entradas, saídas e saldo do mês." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthPicker value={url.month} onChange={url.setMonth} />
        <SummaryCategoryFilter value={categoryId} onChange={url.setCategoryId} />
      </div>
      {content}
    </div>
  )
}
