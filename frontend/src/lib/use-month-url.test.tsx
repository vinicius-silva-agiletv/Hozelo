import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'

import { currentMonth } from '@/lib/month'

import { useMonthUrl } from './use-month-url'

function setup(path: string) {
  let location = ''
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={['/inicio', path]} initialIndex={1}>
      {children}
    </MemoryRouter>
  )
  const { result } = renderHook(
    () => {
      const url = useMonthUrl()
      const current = useLocation()
      location = `${current.pathname}${current.search}`
      return url
    },
    { wrapper },
  )
  return { result, location: () => location }
}

describe('useMonthUrl', () => {
  it('lê mês, categoria e item aberto com padrões para valores inválidos', () => {
    expect(setup('/receitas?mes=2026-12&categoria=2&receita=7').result.current).toMatchObject({ month: '2026-12', categoryId: 2 })
    expect(setup('/receitas?mes=2026-12&receita=7').result.current.opened('receita')).toBe(7)
    const invalid = setup('/receitas?mes=1999-12&categoria=x&receita=0').result.current
    expect(invalid).toMatchObject({ month: currentMonth(), categoryId: null })
    expect(invalid.opened('receita')).toBeNull()
  })

  it('troca mês e filtro e abre/fecha item pelo histórico', () => {
    const { result, location } = setup('/contas-fixas')
    act(() => result.current.setMonth('2027-02'))
    act(() => result.current.setCategoryId(5))
    expect(location()).toBe('/contas-fixas?mes=2027-02&categoria=5')

    act(() => result.current.open('recorrencia', 3))
    expect(location()).toBe('/contas-fixas?mes=2027-02&categoria=5&recorrencia=3')
    act(() => result.current.close('recorrencia'))
    expect(location()).toBe('/contas-fixas?mes=2027-02&categoria=5')
  })

  it('item aberto direto pelo link fecha sem sair da tela', () => {
    const { result, location } = setup('/contas-fixas?recorrencia=3')
    act(() => result.current.close('recorrencia'))
    expect(location()).toBe('/contas-fixas')
  })
})
