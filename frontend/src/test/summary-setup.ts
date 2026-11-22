import { categoriesStore } from '@/test/categories-store'
import { mockApi, storeSession, type Routes } from '@/test/mock-api'
import { renderApp } from '@/test/render'
import { summaryStore, type SeedLedgerItem } from '@/test/summary-store'

/** Categorias dos testes: despesas Casa (1), Internet (2); receitas Salário (3), 13º salário (4). */
export const CASA = { id: 1, name: 'Casa' }
export const INTERNET = { id: 2, name: 'Internet' }
export const SALARIO = { id: 3, name: 'Salário' }
export const DECIMO = { id: 4, name: '13º salário' }

interface Options {
  items?: SeedLedgerItem[]
  openingBalance?: { amount: number; month: string } | null
  routes?: Routes
}

/** Abre o app em `path` com sessão, categorias e o resumo mensal simulado. */
export async function renderSummary(path: string, { items = [], openingBalance = null, routes = {} }: Options = {}) {
  storeSession()
  const categories = categoriesStore([
    { name: 'Casa', type: 'Expense', entriesCount: 0 },
    { name: 'Internet', type: 'Expense', entriesCount: 0 },
    { name: 'Salário', type: 'Income', entriesCount: 0 },
    { name: '13º salário', type: 'Income', entriesCount: 0 },
  ])
  const store = summaryStore({ items, openingBalance })
  const api = mockApi({
    'GET /users': { status: 200, body: { name: 'Família Silva', email: 'familia@exemplo.com' } },
    ...categories.routes,
    ...store.routes,
    ...routes,
  })
  await renderApp(path)
  return { store, ...api }
}
