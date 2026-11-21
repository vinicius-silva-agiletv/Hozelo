import { bodyOf, type Routes } from '@/test/mock-api'
import type { CategoryType, ResponseCategory } from '@/types/api'

/**
 * Lista de categorias em memória para os testes: responde GET/POST/PUT/DELETE como a API
 * (409 para nome repetido no tipo; `blocked` simula categoria com lançamentos).
 */
export function categoriesStore(initial: Omit<ResponseCategory, 'id'>[] = []) {
  let nextId = 1
  const items: ResponseCategory[] = initial.map((item) => ({ ...item, id: nextId++ }))

  const duplicated = (name: string, type: CategoryType, ignoreId?: number) =>
    items.some((c) => c.type === type && c.id !== ignoreId && c.name.toLowerCase() === name.trim().toLowerCase())

  const routes: Routes = {
    'GET /categories?type=Expense': () => ({ status: 200, body: { categories: items.filter((c) => c.type === 'Expense') } }),
    'GET /categories?type=Income': () => ({ status: 200, body: { categories: items.filter((c) => c.type === 'Income') } }),
    'POST /categories': (init: RequestInit) => {
      const { name, type } = bodyOf(init)
      if (duplicated(name, type)) return { status: 409, body: { errors: ['Já existe uma categoria com esse nome.'] } }
      const created = { id: nextId++, name: name.trim(), type, entriesCount: 0 }
      items.push(created)
      return { status: 201, body: created }
    },
  }

  for (const item of items) {
    routes[`PUT /categories/${item.id}`] = (init: RequestInit) => {
      const { name } = bodyOf(init)
      if (duplicated(name, item.type, item.id)) return { status: 409, body: { errors: ['Já existe uma categoria com esse nome.'] } }
      item.name = name.trim()
      return { status: 204 }
    }
    routes[`DELETE /categories/${item.id}`] = () => {
      if (item.entriesCount > 0) {
        return { status: 409, body: { errors: ['A categoria possui lançamentos e não pode ser removida.'] } }
      }
      items.splice(items.indexOf(item), 1)
      return { status: 204 }
    }
  }

  return { items, routes }
}
