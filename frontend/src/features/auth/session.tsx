import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router'

import { setTokenProvider, setUnauthorizedHandler } from '@/lib/api'

import { safeRedirectPath } from './redirect'
import { SessionContext, useSession, type ExitReason, type SessionContextValue } from './use-session'
import { clearSession, loadSession, saveSession, updateStoredAccountName, type StoredSession } from './session-storage'

// O cliente HTTP lê o token direto da sessão guardada, já ao carregar o módulo: assim as primeiras
// consultas (que disparam antes dos efeitos deste provider) já saem com o token.
setTokenProvider(() => loadSession()?.accessToken ?? null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(loadSession)
  const [exitReason, setExitReason] = useState<ExitReason>(null)
  const sessionRef = useRef(session)
  const queryClient = useQueryClient()

  const update = useCallback((next: StoredSession | null, reason: ExitReason = null) => {
    sessionRef.current = next
    setSession(next)
    setExitReason(reason)
  }, [])

  // Sessão inválida/expirada (401 numa requisição com token): a guarda de rota (RequireAuth) leva à
  // entrada com o aviso e o caminho de volta.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!sessionRef.current) return
      clearSession()
      update(null, 'expired')
      queryClient.clear()
    })
    return () => setUnauthorizedHandler(null)
  }, [queryClient, update])

  const value = useMemo<SessionContextValue>(
    () => ({
      isAuthenticated: session !== null,
      exitReason,
      accountName: session?.accountName ?? null,
      signIn: (accessToken, accountName, persistent) => {
        const next = { accessToken, accountName }
        saveSession(next, persistent)
        update(next)
      },
      signOut: () => {
        clearSession()
        update(null, 'signedOut')
        queryClient.clear()
      },
      setAccountName: (accountName) => {
        if (!sessionRef.current || sessionRef.current.accountName === accountName) return
        updateStoredAccountName(accountName)
        update({ ...sessionRef.current, accountName })
      },
    }),
    [session, exitReason, queryClient, update],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

/**
 * Sem sessão → entrada. Quem saiu vai para a entrada limpa; sessão expirada mostra o aviso; nos dois casos
 * de acesso direto ou expiração, guarda o caminho para voltar depois de entrar.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, exitReason } = useSession()
  const location = useLocation()

  if (!isAuthenticated) {
    if (exitReason === 'signedOut') return <Navigate to="/entrar" replace />

    const back = encodeURIComponent(`${location.pathname}${location.search}`)
    const expired = exitReason === 'expired' ? 'expirada=1&' : ''
    return <Navigate to={`/entrar?${expired}voltar=${back}`} replace />
  }
  return children
}

/** Com sessão → área de onde a pessoa veio (`voltar`) ou o resumo. */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession()
  const [params] = useSearchParams()

  if (isAuthenticated) return <Navigate to={safeRedirectPath(params.get('voltar'))} replace />
  return children
}
