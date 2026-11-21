import { Ellipsis } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router'

import { navAreas, shortLabel } from '@/app/navigation'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

import { AccountMenu } from './account-menu'

const tabClass = (active: boolean) =>
  [
    'flex flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium outline-none',
    'focus-visible:ring-3 focus-visible:ring-ring/50',
    active ? 'text-foreground' : 'text-muted-foreground',
  ].join(' ')

/** Barra fixa no rodapé (telas estreitas): 4 áreas + "Mais" com o restante, a conta e Sair. */
export function BottomNav({ className = '' }: { className?: string }) {
  const [moreOpen, setMoreOpen] = useState(false)
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

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger className={tabClass(isOtherActive)} aria-current={isOtherActive ? 'page' : undefined}>
            <Ellipsis className="size-5" aria-hidden />
            Mais
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <SheetHeader>
              <SheetTitle>Mais opções</SheetTitle>
              <SheetDescription className="sr-only">Outras áreas do app e a sua conta.</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4">
              {others.map((area) => (
                <NavLink
                  key={area.key}
                  to={area.path}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                      isActive ? 'bg-muted' : 'hover:bg-muted'
                    }`
                  }
                >
                  <area.icon className="size-5" aria-hidden />
                  {area.label}
                </NavLink>
              ))}
              <Separator className="my-2" />
              <AccountMenu onSignOut={() => setMoreOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
