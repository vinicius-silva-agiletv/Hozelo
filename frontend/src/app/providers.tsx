import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SessionProvider } from '@/features/auth/session'
import { ApiError } from '@/lib/api'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Não insiste em erros 4xx nem de rede; tenta de novo só falhas do servidor (5xx).
        retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 2,
      },
    },
  })
}

/** Providers do app. Precisa estar dentro de um roteador (BrowserRouter em main.tsx, MemoryRouter nos testes). */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </SessionProvider>
      {import.meta.env.DEV && import.meta.env.MODE !== 'test' && <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" />}
    </QueryClientProvider>
  )
}
