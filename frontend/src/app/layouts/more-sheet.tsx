import { NavLink } from 'react-router'

import type { NavArea } from '@/app/navigation'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

import { AccountMenu } from './account-menu'

interface MoreSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  areas: NavArea[]
}

/** Painel "Mais" da barra inferior; baixado só no primeiro toque (fora do pacote inicial). */
export default function MoreSheet({ open, onOpenChange, areas }: MoreSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <SheetHeader>
          <SheetTitle>Mais opções</SheetTitle>
          <SheetDescription className="sr-only">Outras áreas do app e a sua conta.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-1 px-4">
          {areas.map((area) => (
            <NavLink
              key={area.key}
              to={area.path}
              onClick={() => onOpenChange(false)}
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
          <AccountMenu onSignOut={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
