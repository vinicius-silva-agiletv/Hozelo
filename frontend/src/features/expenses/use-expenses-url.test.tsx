import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'

import { currentMonth } from '@/lib/month'

import { useExpensesUrl } from './use-expenses-url'

function setup(path: string) {
  let location = ''
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={['/inicio', path]} initialIndex={1}>
      {children}
    </MemoryRouter>
  )
  const { result } = renderHook(
    () => {
      const url = useExpensesUrl()
      const current = useLocation()
      location = `${current.pathname}${current.search}`
      return url
    },
    { wrapper },
  )
  return { result, location: () => location }
}

describe('useExpensesUrl', () => {
  it('padrões: aba Mês, mês atual, sem filtros', () => {
    const { result } = setup('/despesas')
    expect(result.current).toMatchObject({ tab: 'mes', month: currentMonth(), categoryId: null, status: null, expenseId: null })
  })

  it('lê aba, mês, categoria, situação e despesa do endereço', () => {
    const { result } = setup('/despesas?aba=todas&mes=2026-12&categoria=4&situacao=quitadas&despesa=17')
    expect(result.current).toMatchObject({ tab: 'todas', month: '2026-12', categoryId: 4, status: 'Paid', expenseId: 17 })
  })

  it('valores inválidos voltam aos padrões', () => {
    const { result } = setup('/despesas?aba=x&mes=2101-01&categoria=abc&situacao=talvez&despesa=-1')
    expect(result.current).toMatchObject({ tab: 'mes', month: currentMonth(), categoryId: null, status: null, expenseId: null })
    expect(setup('/despesas?mes=2026-13').result.current.month).toBe(currentMonth())
  })

  it('atualiza o endereço ao trocar mês, filtros e aba', () => {
    const { result, location } = setup('/despesas')
    act(() => result.current.setMonth('2027-01'))
    act(() => result.current.setCategoryId(3))
    act(() => result.current.setTab('todas'))
    act(() => result.current.setStatus('Open'))
    expect(location()).toBe('/despesas?mes=2027-01&categoria=3&aba=todas&situacao=abertas')

    act(() => result.current.setCategoryId(null))
    act(() => result.current.setMonth(currentMonth()))
    expect(location()).toBe('/despesas?aba=todas&situacao=abertas')
  })

  it('abrir o detalhe entra no histórico e fechar volta', () => {
    const { result, location } = setup('/despesas?mes=2026-12')
    act(() => result.current.openExpense(9))
    expect(location()).toBe('/despesas?mes=2026-12&despesa=9')
    act(() => result.current.closeExpense())
    expect(location()).toBe('/despesas?mes=2026-12')
  })

  it('detalhe aberto direto pelo link fecha sem sair da tela', () => {
    const { result, location } = setup('/despesas?despesa=9')
    act(() => result.current.closeExpense())
    expect(location()).toBe('/despesas')
  })
})
