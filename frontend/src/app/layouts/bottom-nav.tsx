import { Ellipsis } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { NavLink, useLocation } from 'react-router'

import { navAreas, shortLabel } from '@/app/navigation'

const importMoreSheet = () => import('./more-sheet')
const MoreSheet = lazy(importMoreSheet)
/** Começa a baixar o painel ao apontar/focar o botão, para abrir sem espera. */
const loadMoreSheet = () => void importMoreSheet()

const tabClass = (active: boolean) =>
  [
    'flex flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium outline-none',
    'focus-visible:ring-3 focus-visible:ring-ring/50',
    active ? 'text-foreground' : 'text-muted-foreground',
  ].join(' ')

/** Barra fixa no rodapé (telas estreitas): 4 áreas + "Mais" com o restante, a conta e Sair. */
export function BottomNav({ className = '' }: { className?: string }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [moreLoaded, setMoreLoaded] = useState(false)
  const location = useLocation()
  const primary = navAreas.filter((area) => area.primaryOnMobile)
  const others = navAreas.filter((area) => !area.primaryOnMobile)
  const isOtherActive = others.some((area) => location.pathname.startsWith(area.path))

  return (
    <nav
      aria-label="Navegação inferior"
      className={`fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur ${className}`}
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 gap-1 px-2">
        {primary.map((area) => (
          <NavLink key={area.key} to={area.path} end={area.path === '/'} className={({ isActive }) => tabClass(isActive)}>
            <area.icon className="size-5" aria-hidden />
            {shortLabel(area)}
          </NavLink>
        ))}

        <button
          type="button"
          className={tabClass(isOtherActive)}
          aria-current={isOtherActive ? 'page' : undefined}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          onPointerEnter={loadMoreSheet}
          onFocus={loadMoreSheet}
          onClick={() => {
            setMoreLoaded(true)
            setMoreOpen(true)
          }}
        >
          <Ellipsis className="size-5" aria-hidden />
          Mais
        </button>
        {moreLoaded && (
          <Suspense fallback={null}>
            <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} areas={others} />
          </Suspense>
        )}
      </div>
    </nav>
  )
}
