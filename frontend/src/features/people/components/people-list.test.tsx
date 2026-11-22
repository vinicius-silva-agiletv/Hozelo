import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { formatCurrency } from '@/lib/format'
import { currentMonth } from '@/lib/month'
import { renderPeople } from '@/test/people-setup'
import { currentLocation } from '@/test/render'

const month = currentMonth()
const money = (value: number) => formatCurrency(value).replace(/\s/g, ' ')
const cards = () => within(screen.getByRole('list', { name: 'Pessoas' })).getAllByRole('listitem')
const seed = {
  people: ['Sogro', 'Esposa', 'Cunhado'],
  charges: [
    { personId: 1, originType: 'Manual' as const, description: 'Usou o cartão', date: `${month}-05`, amount: 350 },
    { personId: 2, originType: 'Recurrence' as const, originId: 4, description: 'Internet · 50%', date: `${month}-10`, amount: 60 },
  ],
  payments: [{ personId: 3, amount: 50, paidOn: `${month}-01` }],
}

describe('Lista de pessoas (US1)', () => {
  it('ordem alfabética com saldos da API, crédito e total geral', async () => {
    await renderPeople('/pessoas', seed)

    expect(await screen.findByRole('heading', { level: 1, name: 'Pessoas' })).toBeInTheDocument()
    expect(document.title).toBe('Pessoas · Hozelo')
    await screen.findByRole('list', { name: 'Pessoas' })
    const texts = cards().map((card) => card.textContent!.replace(/\s/g, ' '))
    expect(texts[0]).toContain('Cunhado')
    expect(texts[0]).toContain(`crédito de ${money(50)}`)
    expect(texts[1]).toContain('Esposa')
    expect(texts[1]).toContain(`Deve até agora ${money(60)}`)
    expect(texts[2]).toContain('Sogro')
    expect(screen.getByLabelText('Total devido por todos').textContent!.replace(/\s/g, ' ')).toContain(money(410))
  })

  it('cadastra, valida e mostra recusa da API', async () => {
    await renderPeople('/pessoas', seed)

    await userEvent.click(await screen.findByRole('button', { name: 'Nova pessoa' }))
    const dialog = await screen.findByRole('dialog', { name: 'Nova pessoa' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))
    expect(await within(dialog).findByText('Informe o nome.')).toBeInTheDocument()

    await userEvent.type(within(dialog).getByLabelText('Nome'), 'esposa')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))
    expect(await within(dialog).findByText('Já existe uma pessoa com esse nome.')).toBeInTheDocument()

    await userEvent.clear(within(dialog).getByLabelText('Nome'))
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Sobrinho')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))
    expect(await screen.findByText('Pessoa cadastrada.')).toBeInTheDocument()
    await waitFor(() => expect(cards()).toHaveLength(4))
  })

  it('renomeia e remove; remoção com lançamentos é recusada no diálogo', async () => {
    const { store } = await renderPeople('/pessoas', { ...seed, people: [...seed.people, 'Primo'] })

    await userEvent.click(await screen.findByRole('button', { name: 'Ações de Esposa' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Renomear' }))
    const dialog = await screen.findByRole('dialog', { name: 'Renomear pessoa' })
    await userEvent.clear(within(dialog).getByLabelText('Nome'))
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Esposa Ana')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Pessoa renomeada.')).toBeInTheDocument()
    expect(store.people.find((p) => p.id === 2)!.name).toBe('Esposa Ana')

    await userEvent.click(screen.getByRole('button', { name: 'Ações de Sogro' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remover' }))
    let confirm = await screen.findByRole('alertdialog', { name: 'Remover pessoa?' })
    await userEvent.click(within(confirm).getByRole('button', { name: 'Remover' }))
    expect(await within(confirm).findByText('A pessoa possui lançamentos e não pode ser removida.')).toBeInTheDocument()
    await userEvent.click(within(confirm).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Ações de Primo' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remover' }))
    confirm = await screen.findByRole('alertdialog', { name: 'Remover pessoa?' })
    await userEvent.click(within(confirm).getByRole('button', { name: 'Remover' }))
    expect(await screen.findByText('Pessoa removida.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Abrir Primo' })).not.toBeInTheDocument())
  })

  it('estado vazio e tocar na pessoa abre o detalhe', async () => {
    await renderPeople('/pessoas')
    expect(await screen.findByText('Nenhuma pessoa cadastrada')).toBeInTheDocument()

    await userEvent.click(screen.getAllByRole('button', { name: 'Nova pessoa' })[0])
    const dialog = await screen.findByRole('dialog', { name: 'Nova pessoa' })
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Esposa')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Abrir Esposa' }))
    await waitFor(() => expect(currentLocation()).toBe('/pessoas/1'))
  })

  it('falha ao carregar mostra "Tentar novamente"', async () => {
    let fail = true
    const { store } = await renderPeople('/pessoas', {
      people: ['Esposa'],
      routes: {
        'GET /people': (init, key) =>
          fail ? { status: 400, body: { errors: ['Erro ao carregar.'] } } : (store.routes['*'] as (i: RequestInit, k: string) => never)(init, key),
      },
    })
    expect(await screen.findByText('Erro ao carregar.')).toBeInTheDocument()
    fail = false
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('button', { name: 'Abrir Esposa' })).toBeInTheDocument()
  })
})
