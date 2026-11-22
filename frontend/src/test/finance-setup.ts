import { categoriesStore } from '@/test/categories-store'
import { financeStore, type SeedIncome, type SeedRecurrence, type SeedReimbursement } from '@/test/finance-store'
import { mockApi, storeSession, type Routes } from '@/test/mock-api'
import { renderApp } from '@/test/render'
import type { ResponsePerson } from '@/types/api'

/** Categorias dos testes: receitas Salário (1), 13º salário (2), Vendas (3); despesas Internet (4), Luz (5), Academia (6), Educação (7). */
export const SALARIO = 1
export const DECIMO = 2
export const VENDAS = 3
export const INTERNET = 4
export const LUZ = 5
export const ACADEMIA = 6
export const EDUCACAO = 7

interface Options {
  incomes?: SeedIncome[]
  recurrences?: SeedRecurrence[]
  reimbursements?: SeedReimbursement[]
  people?: ResponsePerson[]
  noIncomeCategories?: boolean
  routes?: Routes
}

/** Abre o app em `path` com sessão, categorias, pessoas, receitas e recorrências simuladas. */
export async function renderFinance(path: string, { incomes = [], recurrences = [], reimbursements = [], people = [], noIncomeCategories = false, routes = {} }: Options = {}) {
  storeSession()
  const income = (name: string) => ({ name, type: 'Income' as const, entriesCount: 0 })
  const expense = (name: string) => ({ name, type: 'Expense' as const, entriesCount: 0 })
  const categories = categoriesStore([
    ...(noIncomeCategories ? [expense('X1'), expense('X2'), expense('X3')] : [income('Salário'), income('13º salário'), income('Vendas')]),
    expense('Internet'),
    expense('Luz'),
    expense('Academia'),
    expense('Educação'),
  ])
  const store = financeStore({
    categories: categories.items.map(({ id, name, type }) => ({ id, name, type })),
    people,
    incomes,
    recurrences,
    reimbursements,
  })
  const api = mockApi({
    'GET /users': { status: 200, body: { name: 'Família Silva', email: 'familia@exemplo.com' } },
    ...categories.routes,
    ...store.routes,
    ...routes,
  })
  await renderApp(path)
  return { store, ...api }
}
