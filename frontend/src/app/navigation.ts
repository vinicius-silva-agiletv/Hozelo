import { LayoutDashboard, Receipt, Repeat, Settings, TrendingUp, Users, type LucideIcon } from 'lucide-react'

export type NavAreaKey = 'summary' | 'expenses' | 'incomes' | 'fixedBills' | 'people' | 'settings'

export interface NavArea {
  key: NavAreaKey
  label: string
  path: string
  icon: LucideIcon
  description: string
  /** Na barra do rodapé do celular; as demais ficam em "Mais". */
  primaryOnMobile: boolean
}

/** Áreas do app: fonte única para menu lateral, barra do rodapé, "Mais" e rotas (data-model.md, NavArea). */
export const navAreas: NavArea[] = [
  { key: 'summary', label: 'Resumo do mês', path: '/', icon: LayoutDashboard, primaryOnMobile: true,
    description: 'Entradas, saídas e saldo do mês.' },
  { key: 'expenses', label: 'Despesas', path: '/despesas', icon: Receipt, primaryOnMobile: true,
    description: 'Contas, compras e parcelas da família.' },
  { key: 'incomes', label: 'Receitas', path: '/receitas', icon: TrendingUp, primaryOnMobile: true,
    description: 'Salário, 13º e outras entradas.' },
  { key: 'fixedBills', label: 'Contas fixas', path: '/contas-fixas', icon: Repeat, primaryOnMobile: false,
    description: 'Internet, luz, água e outras contas mensais.' },
  { key: 'people', label: 'Pessoas', path: '/pessoas', icon: Users, primaryOnMobile: true,
    description: 'O que outras pessoas devem para a família.' },
  { key: 'settings', label: 'Configurações', path: '/configuracoes', icon: Settings, primaryOnMobile: false,
    description: 'Categorias, saldo inicial e conta.' },
]

/** Rótulo curto para a barra do rodapé. */
export const shortLabel = (area: NavArea) => (area.key === 'summary' ? 'Resumo' : area.label)
