import { Outlet } from 'react-router'

import { Card, CardContent } from '@/components/ui/card'

import { Brand } from './brand'

/** Telas de acesso: cartão centralizado, sem menu. */
export function AuthLayout() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-10">
      <Brand />
      <Card className="w-full max-w-sm">
        <CardContent>
          <Outlet />
        </CardContent>
      </Card>
    </main>
  )
}
