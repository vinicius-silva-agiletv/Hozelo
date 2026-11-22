import { Plus } from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/use-document-title'
import type { ResponsePerson } from '@/types/api'

import { PaymentFormDialog, type PaymentTarget } from '../components/entry-forms'
import { PeopleList } from '../components/people-list'
import { DeletePersonDialog, PersonFormDialog, type PersonFormMode } from '../components/person-dialogs'

/** Pessoas (/pessoas): quem deve quanto (US1) e pagamento direto da lista (FR-015). */
export function PeoplePage() {
  useDocumentTitle('Pessoas')
  const [form, setForm] = useState<PersonFormMode | null>(null)
  const [removing, setRemoving] = useState<ResponsePerson | null>(null)
  const [payment, setPayment] = useState<PaymentTarget | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pessoas"
        description="O que outras pessoas devem para a família."
        actions={
          <Button onClick={() => setForm({ kind: 'create' })}>
            <Plus aria-hidden />
            Nova pessoa
          </Button>
        }
      />
      <PeopleList
        onCreate={() => setForm({ kind: 'create' })}
        onRename={(person) => setForm({ kind: 'rename', person })}
        onDelete={setRemoving}
        onPay={(person) => setPayment({ personId: person.id, personName: person.name, suggested: person.currentMonthDue })}
      />
      <PersonFormDialog mode={form} onClose={() => setForm(null)} />
      <DeletePersonDialog person={removing} onClose={() => setRemoving(null)} />
      <PaymentFormDialog target={payment} onClose={() => setPayment(null)} />
    </div>
  )
}
