import { Plus } from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDocumentTitle } from '@/lib/use-document-title'

import { AllExpensesView } from '../components/all-expenses-view'
import { ExpenseDetailDialog } from '../components/expense-detail-dialog'
import { ExpenseFormDialog, type ExpenseFormMode } from '../components/expense-form-dialog'
import { MonthView } from '../components/month-view'
import { useValidCategoryId } from '../hooks'
import { useExpensesUrl, type ExpensesTab } from '../use-expenses-url'

/** Despesas (/despesas): abas Mês e Todas, detalhe e formulários (clarify Q2). */
export function ExpensesPage() {
  useDocumentTitle('Despesas')
  const url = useExpensesUrl()
  const categoryId = useValidCategoryId(url.categoryId)
  const [form, setForm] = useState<ExpenseFormMode | null>(null)

  const openCreate = () => setForm({ kind: 'create', viewMonth: url.tab === 'mes' ? url.month : null })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Despesas"
        description="Contas, compras e parcelas da família."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden />
            Nova despesa
          </Button>
        }
      />

      <Tabs value={url.tab} onValueChange={(value) => url.setTab(value as ExpensesTab)}>
        <TabsList>
          <TabsTrigger value="mes">Mês</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>
        <TabsContent value="mes" className="pt-2">
          <MonthView
            month={url.month}
            categoryId={categoryId}
            onMonthChange={url.setMonth}
            onCategoryChange={url.setCategoryId}
            onOpenExpense={url.openExpense}
            onCreate={openCreate}
          />
        </TabsContent>
        <TabsContent value="todas" className="pt-2">
          <AllExpensesView
            categoryId={categoryId}
            status={url.status}
            onCategoryChange={url.setCategoryId}
            onStatusChange={url.setStatus}
            onOpenExpense={url.openExpense}
            onCreate={openCreate}
          />
        </TabsContent>
      </Tabs>

      <ExpenseFormDialog mode={form} onClose={() => setForm(null)} />
      <ExpenseDetailDialog expenseId={url.expenseId} onClose={url.closeExpense} />
    </div>
  )
}
