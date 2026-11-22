import { ArrowLeft, HandCoins, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApiError, errorMessages } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { useDocumentTitle } from '@/lib/use-document-title'
import { useMonthUrl } from '@/lib/use-month-url'

import { ChargeFormDialog, PaymentFormDialog, type ChargeTarget, type PaymentTarget } from '../components/entry-forms'
import { OverviewView } from '../components/overview-view'
import { DeleteEntryDialog, type DeleteEntryTarget } from '../components/person-dialogs'
import { StatementView } from '../components/statement-view'
import { useDeleteCharge, useDeletePayment, usePeople, usePersonStatement, usePersonSummary } from '../hooks'

type PersonTab = 'extrato' | 'resumo'

/** Pessoa (/pessoas/:id): Extrato do mês e Resumo geral (US2–US6, clarify Q1). */
export function PersonPage() {
  const params = useParams()
  const personId = Number(params.id)
  const validId = Number.isInteger(personId) && personId > 0
  const navigate = useNavigate()
  const url = useMonthUrl()
  const [search, setSearch] = useSearchParams()
  const tab: PersonTab = search.get('aba') === 'resumo' ? 'resumo' : 'extrato'

  const statement = usePersonStatement(personId, url.month, validId)
  const overview = usePersonSummary(personId, validId && tab === 'resumo')
  const people = usePeople()
  const deleteCharge = useDeleteCharge(personId)
  const deletePayment = useDeletePayment(personId)
  const name = statement.data?.person.name ?? overview.data?.person.name ?? ''
  useDocumentTitle(name || 'Pessoa')

  const [payment, setPayment] = useState<PaymentTarget | null>(null)
  const [charge, setCharge] = useState<ChargeTarget | null>(null)
  const [removing, setRemoving] = useState<DeleteEntryTarget | null>(null)

  // Pessoa inexistente (ou removida em outro aparelho): avisa e volta à lista.
  const left = useRef(false)
  const error = statement.error ?? overview.error
  const notFound = !validId || (error instanceof ApiError && error.status === 404)
  useEffect(() => {
    if (notFound && !left.current) {
      left.current = true
      toast.error(error ? errorMessages(error).join(' ') : 'Pessoa não encontrada.')
      navigate('/pessoas', { replace: true })
    }
  }, [notFound, error, navigate])

  const setTab = (next: PersonTab) =>
    setSearch(
      (current) => {
        const copy = new URLSearchParams(current)
        if (next === 'extrato') copy.delete('aba')
        else copy.set('aba', next)
        return copy
      },
      { replace: true },
    )

  const suggested = people.data?.find((p) => p.id === personId)?.currentMonthDue

  return (
    <div className="space-y-6">
      <Link to="/pessoas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Pessoas
      </Link>
      <PageHeader
        title={name || 'Pessoa'}
        actions={
          <>
            <Button onClick={() => setPayment({ personId, personName: name, suggested })}>
              <HandCoins aria-hidden />
              Pagamento
            </Button>
            <Button variant="outline" onClick={() => setCharge({ personId })}>
              <Plus aria-hidden />
              Cobrança avulsa
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as PersonTab)}>
        <TabsList>
          <TabsTrigger value="extrato">Extrato do mês</TabsTrigger>
          <TabsTrigger value="resumo">Resumo geral</TabsTrigger>
        </TabsList>
        <TabsContent value="extrato" className="pt-2">
          <StatementView
            month={url.month}
            statement={statement}
            onMonthChange={url.setMonth}
            onEditCharge={(item) => setCharge({ personId, charge: item })}
            onDeleteCharge={(item) =>
              setRemoving({
                title: 'Remover cobrança?',
                description: `"${item.description}" será removida. Os pagamentos que a abatiam passam a abater as outras cobranças.`,
                successMessage: 'Cobrança removida.',
                onConfirm: () => deleteCharge.mutateAsync(item.originId),
              })
            }
            onEditPayment={(item) => setPayment({ personId, personName: name, payment: item })}
            onDeletePayment={(item) =>
              setRemoving({
                title: 'Remover pagamento?',
                description: `O pagamento de ${formatDate(item.paidOn)} será removido e as cobranças voltam a ficar em aberto conforme a regra.`,
                successMessage: 'Pagamento removido.',
                onConfirm: () => deletePayment.mutateAsync(item.id),
              })
            }
          />
        </TabsContent>
        <TabsContent value="resumo" className="pt-2">
          <OverviewView overview={overview} />
        </TabsContent>
      </Tabs>

      <PaymentFormDialog target={payment} onClose={() => setPayment(null)} />
      <ChargeFormDialog target={charge} onClose={() => setCharge(null)} />
      <DeleteEntryDialog target={removing} onClose={() => setRemoving(null)} />
    </div>
  )
}
