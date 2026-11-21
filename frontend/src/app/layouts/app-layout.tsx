import { Outlet } from 'react-router'

import { useProfile } from '@/features/auth/hooks'

import { BottomNav } from './bottom-nav'
import { SidebarNav } from './sidebar-nav'

/** Layout conectado: menu lateral a partir de 768 px; barra no rodapé abaixo disso (FR-013). */
export function AppLayout() {
  useProfile()

  return (
    <div className="min-h-svh md:grid md:grid-cols-[15rem_1fr]">
      <SidebarNav className="hidden md:flex" />
      <main className="min-w-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 md:py-8">
          <Outlet />
        </div>
      </main>
      <BottomNav className="md:hidden" />
    </div>
  )
}
