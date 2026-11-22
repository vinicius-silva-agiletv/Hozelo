import { ChevronRight, EllipsisVertical, HandCoins, Pencil, Trash2, Users } from 'lucide-react'
import { useNavigate } from 'react-router'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessages } from '@/lib/api'
import { formatBalance, formatCurrency } from '@/lib/format'
import { fromCents, toCents } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { ResponsePerson } from '@/types/api'

import { usePeople } from '../hooks'

interface PeopleListProps {
  onCreate: () => void
  onRename: (person: ResponsePerson) => void
  onDelete: (person: ResponsePerson) => void
  onPay: (person: ResponsePerson) => void
}

/** Lista de pessoas com quanto cada uma deve (US1, FR-001) e a ação "Pagamento" (FR-015). */
export function PeopleList({ onCreate, onRename, onDelete, onPay }: PeopleListProps) {
  const people = usePeople()
  const navigate = useNavigate()

  if (people.isPending) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Carregando pessoas">
        {[0, 1].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    )
  }
  if (people.isError) {
    return (
      <ApiErrorAlert messages={errorMessages(people.error)}>
        <Button variant="outline" size="sm" onClick={() => people.refetch()}>Tentar novamente</Button>
      </ApiErrorAlert>
    )
  }
  if (people.data.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhuma pessoa cadastrada"
        description="Cadastre quem divide despesas com a família para acompanhar quanto cada um deve."
        action={<Button onClick={onCreate}>Nova pessoa</Button>}
      />
    )
  }

  const total = fromCents(people.data.reduce((sum, p) => sum + Math.max(0, toCents(p.balanceUntilNow)), 0))

  return (
    <div className="space-y-4">
      <div className="rounded-xl border px-3 py-2" aria-label="Total devido por todos">
        <p className="text-xs text-muted-foreground">Total devido por todos</p>
        <p className="font-heading text-lg font-semibold tabular-nums">{formatCurrency(total)}</p>
      </div>
      <ul aria-label="Pessoas" className="grid gap-2 md:grid-cols-2">
        {people.data.map((person) => (
          <li key={person.id} className="flex items-center gap-2 rounded-xl border py-2 pr-1 pl-4">
            <button
              type="button"
              onClick={() => navigate(`/pessoas/${person.id}`)}
              aria-label={`Abrir ${person.name}`}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{person.name}</span>
                <span className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
                  <span>
                    <span className="text-muted-foreground">Deve até agora </span>
                    <span className={cn('font-medium tabular-nums', person.balanceUntilNow < 0 && 'text-emerald-600 dark:text-emerald-400')}>
                      {formatBalance(person.balanceUntilNow)}
                    </span>
                  </span>
                  <span>
                    <span className="text-muted-foreground">No mês </span>
                    <span className="tabular-nums">{formatBalance(person.currentMonthDue)}</span>
                  </span>
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
            <Button variant="outline" size="sm" onClick={() => onPay(person)} aria-label={`Pagamento de ${person.name}`}>
              <HandCoins aria-hidden />
              <span className="hidden sm:inline">Pagamento</span>
            </Button>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Ações de ${person.name}`}>
                  <EllipsisVertical aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onRename(person)}>
                  <Pencil aria-hidden />
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => onDelete(person)}>
                  <Trash2 aria-hidden />
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>
    </div>
  )
}
