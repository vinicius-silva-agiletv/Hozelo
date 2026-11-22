import type { CategoryType, EntryKind, ExpenseStatus } from '@/types/api'

/** Chaves de cache do TanStack Query compartilhadas entre features (research.md §2/§3). */
export const queryKeys = {
  profile: ['profile'] as const,
  categories: ['categories'] as const,
  categoriesByType: (type: CategoryType) => ['categories', type] as const,
  openingBalance: ['opening-balance'] as const,
  installments: ['installments'] as const,
  monthlyInstallments: (month: string, categoryId: number | null) => ['installments', month, categoryId] as const,
  expenses: ['expenses'] as const,
  expenseList: (filters: { categoryId: number | null; status: ExpenseStatus | null }) => ['expenses', filters] as const,
  expense: (id: number) => ['expense', id] as const,
  people: ['people'] as const,
  summary: ['summary'] as const,
  monthlySummary: (month: string, categoryId: number | null) => ['summary', month, categoryId] as const,
  incomes: ['incomes'] as const,
  income: (id: number) => ['income', id] as const,
  recurrences: ['recurrences'] as const,
  recurrenceList: (kind: EntryKind) => ['recurrences', kind] as const,
  recurrence: (id: number) => ['recurrence', id] as const,
  personStatements: ['person-statement'] as const,
  personStatement: (id: number, month: string) => ['person-statement', id, month] as const,
  personSummaries: ['person-summary'] as const,
  personSummary: (id: number) => ['person-summary', id] as const,
}

/** Tudo que depende das cobranças das pessoas (mudam com despesas e contas fixas divididas). */
export const peopleDependentKeys = [queryKeys.people, queryKeys.personStatements, queryKeys.personSummaries]
