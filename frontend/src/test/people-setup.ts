import { mockApi, storeSession, type Routes } from '@/test/mock-api'
import { peopleStore, type SeedCharge, type SeedPayment } from '@/test/people-store'
import { renderApp } from '@/test/render'

interface Options {
  people?: string[]
  charges?: SeedCharge[]
  payments?: SeedPayment[]
  routes?: Routes
}

/** Abre o app em `path` com sessão e pessoas, cobranças e pagamentos simulados. */
export async function renderPeople(path: string, { people = [], charges = [], payments = [], routes = {} }: Options = {}) {
  storeSession()
  const store = peopleStore({ people, charges, payments })
  const api = mockApi({
    'GET /users': { status: 200, body: { name: 'Família Silva', email: 'familia@exemplo.com' } },
    ...store.routes,
    ...routes,
  })
  await renderApp(path)
  return { store, ...api }
}
