import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { addMonths, currentMonth, formatMonth } from '@/lib/month'
import { DECIMO, renderFinance } from '@/test/finance-setup'
import { bodyOf } from '@/test/mock-api'
import { currentLocation } from '@/test/render'

const month = currentMonth()
const seed = { incomes: [{ name: '13º salário', categoryId: DECIMO, amount: 3000, expectedDate: `${month}-20`, notes: 'Primeira parcela' }] }

describe('Editar e remover avulsa (US6)', () => {
  it('abre pela linha, edita valor e data (muda de mês)', async () => {
    const { calls } = await renderFinance('/receitas', seed)

    await userEvent.click(await screen.findByRole('button', { name: 'Abrir 13º salário' }))
    expect(currentLocation()).toContain('receita=1')
    const detail = await screen.findByRole('dialog', { name: '13º salário' })
    expect(within(detail).getByText('Primeira parcela')).toBeInTheDocument()

    await userEvent.click(within(detail).getByRole('button', { name: 'Editar' }))
    const form = await screen.findByRole('dialog', { name: 'Editar receita' })
    expect(within(form).queryByRole('switch', { name: 'Já recebida' })).not.toBeInTheDocument()
    expect(within(form).queryByRole('radio', { name: 'Todo mês' })).not.toBeInTheDocument()
    const amount = within(form).getByRole('textbox', { name: 'Valor' })
    await userEvent.clear(amount)
    await userEvent.type(amount, '350000')
    const nextDate = `${addMonths(month, 1)}-05`
    fireEvent.change(within(form).getByLabelText('Data prevista'), { target: { value: nextDate } })
    await userEvent.click(within(form).getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Receita atualizada.')).toBeInTheDocument()
    expect(bodyOf(calls.find((call) => call.key === 'PUT /incomes/1')!.init)).toMatchObject({ amount: 3500, expectedDate: nextDate })
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Nenhuma receita neste mês')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(await screen.findByRole('list', { name: `Receitas de ${formatMonth(addMonths(month, 1))}` })).toHaveTextContent('13º salário')
  })

  it('remove com confirmação', async () => {
    await renderFinance('/receitas?receita=1', seed)

    const detail = await screen.findByRole('dialog', { name: '13º salário' })
    await userEvent.click(await within(detail).findByRole('button', { name: 'Remover' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Remover receita?' })
    await userEvent.click(within(confirm).getByRole('button', { name: 'Remover' }))

    expect(await screen.findByText('Receita removida.')).toBeInTheDocument()
    await waitFor(() => expect(currentLocation()).not.toContain('receita='))
    expect(await screen.findByText('Nenhuma receita neste mês')).toBeInTheDocument()
  })

  it('avulsa inexistente: avisa e fecha', async () => {
    await renderFinance('/receitas?receita=42')
    expect(await screen.findByText('Receita não encontrada.')).toBeInTheDocument()
    await waitFor(() => expect(currentLocation()).not.toContain('receita='))
  })
})
