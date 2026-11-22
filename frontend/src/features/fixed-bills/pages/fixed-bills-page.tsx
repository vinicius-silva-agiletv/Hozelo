import { Plus } from 'lucide-react'
import { useState } from 'react'

import { MonthPicker } from '@/components/shared/month-picker'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { RecurrenceDetailDialog } from '@/features/recurrences/components/recurrence-detail-dialog'
import { RecurrenceFormDialog, type RecurrenceFormMode } from '@/features/recurrences/components/recurrence-form-dialog'
import { ValueDialog, type ValueDialogTarget } from '@/features/recurrences/components/settle-dialogs'
import { useDocumentTitle } from '@/lib/use-document-title'
import { useMonthUrl } from '@/lib/use-month-url'

import { FixedBillMonthList } from '../components/fixed-bill-month-list'

/** Contas fixas (/contas-fixas): despesas que se repetem todo mês (US4, US5, US7). */
export function FixedBillsPage() {
  useDocumentTitle('Contas fixas')
  const url = useMonthUrl()
  const [form, setForm] = useState<RecurrenceFormMode | null>(null)
  const [valueDialog, setValueDialog] = useState<ValueDialogTarget | null>(null)
  const openCreate = () => setForm({ kind: 'create', entryKind: 'Expense', viewMonth: url.month })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas fixas"
        description="Internet, luz, água e outras contas mensais."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden />
            Nova conta fixa
          </Button>
        }
      />
      <MonthPicker value={url.month} onChange={url.setMonth} />
      <FixedBillMonthList
        month={url.month}
        onOpenRecurrence={(id) => url.open('recorrencia', id)}
        onOpenDialog={setValueDialog}
        onCreate={openCreate}
      />
      <RecurrenceFormDialog mode={form} onClose={() => setForm(null)} />
      <ValueDialog target={valueDialog} onClose={() => setValueDialog(null)} />
      <RecurrenceDetailDialog recurrenceId={url.opened('recorrencia')} viewMonth={url.month} onClose={() => url.close('recorrencia')} />
    </div>
  )
}
