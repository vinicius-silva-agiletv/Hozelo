import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { categoriesStore } from '@/test/categories-store'
import { bodyOf, mockApi, storeSession, type Routes } from '@/test/mock-api'
import { renderWithProviders } from '@/test/render'

import { CategoriesSection } from './categories-section'

function renderSection(routes: Routes) {
  storeSession()
  const api = mockApi(routes)
  renderWithProviders(<CategoriesSection />)
  return api
}

const names = (list: HTMLElement) =>
  within(list).getAllByRole('listitem').map((item) => item.querySelector('p')?.textContent)

describe('Categorias - ver e criar (US1)', () => {
  it('lista por tipo com a quantidade de lançamentos', async () => {
    const store = categoriesStore([
      { name: 'Mercado', type: 'Expense', entriesCount: 3 },
      { name: 'Luz', type: 'Expense', entriesCount: 1 },
      { name: 'Lazer', type: 'Expense', entriesCount: 0 },
      { name: 'Salário', type: 'Income', entriesCount: 12 },
    ])
    renderSection(store.routes)

    const list = await screen.findByRole('list', { name: 'Despesas' })
    expect(names(list)).toEqual(['Lazer', 'Luz', 'Mercado'])
    expect(within(list).getByText('Nenhum lançamento')).toBeInTheDocument()
    expect(within(list).getByText('1 lançamento')).toBeInTheDocument()
    expect(within(list).getByText('3 lançamentos')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: 'Receitas' }))
    const incomes = await screen.findByRole('list', { name: 'Receitas' })
    expect(within(incomes).getByText('Salário')).toBeInTheDocument()
    expect(within(incomes).getByText('12 lançamentos')).toBeInTheDocument()
  })

  it('mostra carregamento e, em caso de falha, "Tentar novamente"', async () => {
    let fail = true
    renderSection({
      'GET /categories?type=Expense': () =>
        fail
          ? { status: 400, body: { errors: ['Erro ao carregar.'] } }
          : { status: 200, body: { categories: [{ id: 1, name: 'Luz', type: 'Expense', entriesCount: 0 }] } },
    })

    expect(screen.getByLabelText('Carregando despesas')).toBeInTheDocument()
    expect(await screen.findByText('Erro ao carregar.')).toBeInTheDocument()

    fail = false
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Luz')).toBeInTheDocument()
  })

  it('estado vazio oferece criar e usar sugestões', async () => {
    renderSection(categoriesStore().routes)

    expect(await screen.findByText('Nenhuma categoria de despesa')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nova categoria' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Usar sugestões' })).toBeInTheDocument()
  })

  it('cria categoria no tipo da aba e atualiza a lista', async () => {
    const store = categoriesStore([{ name: 'Luz', type: 'Expense', entriesCount: 0 }])
    const { calls } = renderSection(store.routes)

    await userEvent.click(await screen.findByRole('button', { name: 'Nova categoria' }))
    const dialog = await screen.findByRole('dialog', { name: 'Nova categoria' })
    expect(within(dialog).getByRole('radio', { name: 'Despesa' })).toBeChecked()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar categoria' }))
    expect(await within(dialog).findByText('Informe o nome da categoria.')).toBeInTheDocument()

    await userEvent.type(within(dialog).getByLabelText('Nome'), '  Farmácia ')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar categoria' }))

    expect(await screen.findByText('Categoria criada.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Farmácia')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'POST /categories')!.init)).toEqual({ name: 'Farmácia', type: 'Expense' })
  })

  it('mesmo nome em outro tipo é aceito escolhendo o tipo no formulário', async () => {
    const store = categoriesStore([{ name: 'Carro', type: 'Expense', entriesCount: 0 }])
    renderSection(store.routes)

    await userEvent.click(await screen.findByRole('button', { name: 'Nova categoria' }))
    const dialog = await screen.findByRole('dialog', { name: 'Nova categoria' })
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Receita' }))
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Carro')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar categoria' }))

    expect(await screen.findByText('Categoria criada.')).toBeInTheDocument()
    expect(store.items.filter((item) => item.name === 'Carro').map((item) => item.type)).toEqual(['Expense', 'Income'])
  })

  it('nome repetido no tipo mostra a mensagem da API no formulário', async () => {
    renderSection(categoriesStore([{ name: 'Luz', type: 'Expense', entriesCount: 0 }]).routes)

    await userEvent.click(await screen.findByRole('button', { name: 'Nova categoria' }))
    const dialog = await screen.findByRole('dialog', { name: 'Nova categoria' })
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'luz')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar categoria' }))

    expect(await within(dialog).findByText('Já existe uma categoria com esse nome.')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Nova categoria' })).toBeInTheDocument()
  })
})

describe('Categorias - renomear e remover (US2)', () => {
  const openActions = async (name: string, action: 'Renomear' | 'Remover') => {
    await userEvent.click(await screen.findByRole('button', { name: `Ações de ${name}` }))
    await userEvent.click(await screen.findByRole('menuitem', { name: action }))
  }

  it('renomeia mantendo o tipo e reordena a lista', async () => {
    const store = categoriesStore([
      { name: 'Lazer', type: 'Expense', entriesCount: 2 },
      { name: 'Mercado', type: 'Expense', entriesCount: 0 },
    ])
    const { calls } = renderSection(store.routes)

    await openActions('Lazer', 'Renomear')
    const dialog = await screen.findByRole('dialog', { name: 'Renomear categoria' })
    expect(within(dialog).getByRole('radio', { name: 'Despesa' })).toBeDisabled()

    const input = within(dialog).getByLabelText('Nome')
    expect(input).toHaveValue('Lazer')
    await userEvent.clear(input)
    await userEvent.type(input, 'Passeios')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Categoria renomeada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'PUT /categories/1')!.init)).toEqual({ name: 'Passeios' })
    await waitFor(() => expect(names(screen.getByRole('list', { name: 'Despesas' }))).toEqual(['Mercado', 'Passeios']))
  })

  it('renomear para nome existente mostra a mensagem da API', async () => {
    renderSection(
      categoriesStore([
        { name: 'Lazer', type: 'Expense', entriesCount: 0 },
        { name: 'Mercado', type: 'Expense', entriesCount: 0 },
      ]).routes,
    )

    await openActions('Lazer', 'Renomear')
    const dialog = await screen.findByRole('dialog', { name: 'Renomear categoria' })
    await userEvent.clear(within(dialog).getByLabelText('Nome'))
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'mercado')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(await within(dialog).findByText('Já existe uma categoria com esse nome.')).toBeInTheDocument()
  })

  it('remove após confirmação', async () => {
    renderSection(
      categoriesStore([
        { name: 'Lazer', type: 'Expense', entriesCount: 0 },
        { name: 'Mercado', type: 'Expense', entriesCount: 0 },
      ]).routes,
    )

    await openActions('Lazer', 'Remover')
    const dialog = await screen.findByRole('alertdialog', { name: 'Remover categoria?' })
    expect(within(dialog).getByText(/"Lazer" será removida/)).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remover' }))

    expect(await screen.findByText('Categoria removida.')).toBeInTheDocument()
    await waitFor(() => expect(names(screen.getByRole('list', { name: 'Despesas' }))).toEqual(['Mercado']))
  })

  it('categoria com lançamentos: mostra a recusa no diálogo e continua na lista', async () => {
    renderSection(categoriesStore([{ name: 'Mercado', type: 'Expense', entriesCount: 4 }]).routes)

    await openActions('Mercado', 'Remover')
    const dialog = await screen.findByRole('alertdialog', { name: 'Remover categoria?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remover' }))

    expect(await within(dialog).findByText('A categoria possui lançamentos e não pode ser removida.')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(names(screen.getByRole('list', { name: 'Despesas' }))).toEqual(['Mercado'])
  })
})
