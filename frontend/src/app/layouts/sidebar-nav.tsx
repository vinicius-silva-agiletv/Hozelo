import { NavLink } from 'react-router'

import { navAreas } from '@/app/navigation'
import { Separator } from '@/components/ui/separator'

import { AccountMenu } from './account-menu'
import { Brand } from './brand'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none',
    'focus-visible:ring-3 focus-visible:ring-ring/50',
    isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  ].join(' ')

/** Menu lateral fixo (telas a partir de 768 px). */
export function SidebarNav({ className = '' }: { className?: string }) {
  return (
    <aside className={`sticky top-0 h-svh flex-col gap-4 border-r bg-background p-4 ${className}`}>
      <div className="px-2 py-1">
        <Brand />
      </div>
      <nav aria-label="Menu principal" className="flex flex-1 flex-col gap-1">
        {navAreas.map((area) => (
          <NavLink key={area.key} to={area.path} end={area.path === '/'} className={linkClass}>
            <area.icon className="size-4" aria-hidden />
            {area.label}
          </NavLink>
        ))}
      </nav>
      <Separator />
      <AccountMenu />
    </aside>
  )
}
