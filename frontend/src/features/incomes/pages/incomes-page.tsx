import { Plus } from 'lucide-react'
import { useState } from 'react'

import { CategoryFilter } from '@/components/shared/category-filter'
import { MonthPicker } from '@/components/shared/month-picker'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { useCategories } from '@/features/categories/hooks'
import { RecurrenceDetailDialog } from '@/features/recurrences/components/recurrence-detail-dialog'
import { ValueDialog, type ValueDialogTarget } from '@/features/recurrences/components/settle-dialogs'
import { useDocumentTitle } from '@/lib/use-document-title'
import { useMonthUrl } from '@/lib/use-month-url'

import { IncomeDetailDialog } from '../components/income-detail-dialog'
import { IncomeFormDialog, type IncomeFormMode } from '../components/income-form-dialog'
import { IncomeMonthList } from '../components/income-month-list'

/** Receitas (/receitas): o que entra no mês (US1–US3, US5, US6). */
export function IncomesPage() {
  useDocumentTitle('Receitas')
  const url = useMonthUrl()
  const categories = useCategories('Income')
  const categoryId =
    url.categoryId !== null && categories.data && !categories.data.some((c) => c.id === url.categoryId) ? null : url.categoryId
  const [form, setForm] = useState<IncomeFormMode | null>(null)
  const [valueDialog, setValueDialog] = useState<ValueDialogTarget | null>(null)
  const openCreate = () => setForm({ kind: 'create', viewMonth: url.month })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receitas"
        description="Salário, 13º e outras entradas."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden />
            Nova receita
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthPicker value={url.month} onChange={url.setMonth} />
        <CategoryFilter id="income-category-filter" type="Income" value={categoryId} onChange={url.setCategoryId} />
      </div>
      <IncomeMonthList
        month={url.month}
        categoryId={categoryId}
        onOpenIncome={(id) => url.open('receita', id)}
        onOpenRecurrence={(id) => url.open('recorrencia', id)}
        onOpenDialog={setValueDialog}
        onCreate={openCreate}
      />
      <IncomeFormDialog mode={form} onClose={() => setForm(null)} />
      <ValueDialog target={valueDialog} onClose={() => setValueDialog(null)} />
      <IncomeDetailDialog incomeId={url.opened('receita')} onClose={() => url.close('receita')} />
      <RecurrenceDetailDialog recurrenceId={url.opened('recorrencia')} viewMonth={url.month} onClose={() => url.close('recorrencia')} />
    </div>
  )
}
