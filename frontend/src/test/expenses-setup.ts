import { categoriesStore } from '@/test/categories-store'
import { expensesStore, type SeedExpense } from '@/test/expenses-store'
import { mockApi, storeSession, type Routes } from '@/test/mock-api'
import { renderApp } from '@/test/render'
import type { ResponsePerson } from '@/types/api'

/** Categorias de despesa dos testes: Casa (1), Transporte (2), Moradia (3). */
export const CASA = 1
export const TRANSPORTE = 2
export const MORADIA = 3

interface Options {
  expenses?: SeedExpense[]
  people?: ResponsePerson[]
  noCategories?: boolean
  routes?: Routes
}

/** Abre o app em `path` com a sessão, categorias, pessoas e despesas simuladas. */
export async function renderExpenses(path = '/despesas', { expenses = [], people = [], noCategories = false, routes = {} }: Options = {}) {
  storeSession()
  const categories = categoriesStore(
    noCategories
      ? [{ name: 'Salário', type: 'Income', entriesCount: 0 }]
      : [
          { name: 'Casa', type: 'Expense', entriesCount: 0 },
          { name: 'Transporte', type: 'Expense', entriesCount: 0 },
          { name: 'Moradia', type: 'Expense', entriesCount: 0 },
        ],
  )
  const store = expensesStore({
    categories: categories.items.filter((c) => c.type === 'Expense').map(({ id, name }) => ({ id, name })),
    people,
    expenses,
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

export const person = (id: number, name: string): ResponsePerson => ({ id, name, balanceUntilNow: 0, currentMonthDue: 0 })
