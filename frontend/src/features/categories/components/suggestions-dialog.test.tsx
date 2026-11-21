import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { categoriesStore } from '@/test/categories-store'
import { bodyOf, mockApi, storeSession, type Reply, type Routes } from '@/test/mock-api'
import { renderWithProviders } from '@/test/render'

import { CategoriesSection } from './categories-section'

async function openSuggestions(routes: Routes) {
  storeSession()
  const api = mockApi(routes)
  renderWithProviders(<CategoriesSection />)
  await userEvent.click(await screen.findByRole('button', { name: 'Usar sugestões' }))
  return { ...api, dialog: await screen.findByRole('dialog', { name: 'Sugestões de despesas' }) }
}

describe('Usar sugestões (US1)', () => {
  it('cria só as marcadas', async () => {
    const { dialog, calls } = await openSuggestions(categoriesStore().routes)

    const boxes = within(dialog).getAllByRole('checkbox')
    expect(boxes).toHaveLength(9)
    boxes.forEach((box) => expect(box).toBeChecked())

    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Lazer' }))
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Saúde' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar 7 categorias' }))

    expect(await screen.findByText('7 categorias criadas.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const sent = calls.filter((call) => call.key === 'POST /categories').map((call) => bodyOf(call.init))
    expect(sent.map((body) => body.name)).toEqual(['Mercado', 'Moradia', 'Água', 'Luz', 'Internet', 'Transporte', 'Cartão de crédito'])
    expect(sent.every((body) => body.type === 'Expense')).toBe(true)
    expect(await screen.findByText('Cartão de crédito')).toBeInTheDocument()
  })

  it('sugestões existentes aparecem desmarcadas com "já existe"', async () => {
    const { dialog } = await openSuggestions(categoriesStore([{ name: 'luz', type: 'Expense', entriesCount: 0 }]).routes)

    const light = within(dialog).getByRole('checkbox', { name: /Luz/ })
    expect(light).not.toBeChecked()
    expect(light).toBeDisabled()
    expect(within(dialog).getByText('já existe')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Criar 8 categorias' })).toBeInTheDocument()
  })

  it('falha parcial mostra o que foi criado e a recusa de cada item', async () => {
    const store = categoriesStore()
    const create = store.routes['POST /categories'] as (init: RequestInit) => Reply
    store.routes['POST /categories'] = (init) =>
      bodyOf(init).name === 'Moradia' ? { status: 400, body: { errors: ['Nome inválido.'] } } : create(init)

    const { dialog } = await openSuggestions(store.routes)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar 9 categorias' }))

    expect(await screen.findByText('8 categorias criadas.')).toBeInTheDocument()
    expect(await within(dialog).findByText('Moradia: Nome inválido.')).toBeInTheDocument()
    expect(within(dialog).getByRole('checkbox', { name: 'Moradia' })).toBeChecked()
    await waitFor(() => expect(within(dialog).getAllByText('já existe')).toHaveLength(8))
  })

  it('sem nenhuma marcada não dá para confirmar', async () => {
    const { dialog } = await openSuggestions(categoriesStore().routes)

    for (const box of within(dialog).getAllByRole('checkbox')) await userEvent.click(box)
    expect(within(dialog).getByRole('button', { name: 'Criar categorias' })).toBeDisabled()
  })
})
