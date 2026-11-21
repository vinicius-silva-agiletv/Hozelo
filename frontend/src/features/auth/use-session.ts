import { createContext, useContext } from 'react'

/** Por que não há sessão: a guarda de rota usa isso para montar o redirecionamento. */
export type ExitReason = 'signedOut' | 'expired' | null

export interface SessionContextValue {
  isAuthenticated: boolean
  exitReason: ExitReason
  accountName: string | null
  signIn: (accessToken: string, accountName: string, persistent: boolean) => void
  signOut: () => void
  setAccountName: (accountName: string) => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession precisa estar dentro de <SessionProvider>.')
  return context
}
