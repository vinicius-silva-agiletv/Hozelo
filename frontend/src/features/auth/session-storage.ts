/**
 * Sessão guardada no navegador (research.md §1–§2):
 * "Manter conectado" → localStorage (sobrevive ao fechar o navegador); senão → sessionStorage.
 */

const KEY = 'hozelo.session'

export interface StoredSession {
  accessToken: string
  accountName: string
}

/** Lê o `exp` (segundos) do JWT; null se o token for inválido. */
export function decodeTokenExpiry(token: string): number | null {
  const payload = token.split('.')[1]
  if (!payload) return null

  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const exp = (JSON.parse(json) as { exp?: unknown }).exp
    return typeof exp === 'number' ? exp : null
  } catch {
    return null
  }
}

export function isTokenExpired(token: string, nowSeconds = Date.now() / 1000) {
  const exp = decodeTokenExpiry(token)
  return exp === null || exp <= nowSeconds
}

const storages = () => [localStorage, sessionStorage]

function read(storage: Storage): StoredSession | null {
  const raw = storage.getItem(KEY)
  if (!raw) return null

  try {
    const value = JSON.parse(raw) as Partial<StoredSession>
    if (typeof value.accessToken === 'string' && typeof value.accountName === 'string') {
      return { accessToken: value.accessToken, accountName: value.accountName }
    }
  } catch {
    // conteúdo inválido
  }
  return null
}

/** Sessão válida (não expirada) de qualquer um dos armazenamentos; descarta as inválidas. */
export function loadSession(): StoredSession | null {
  for (const storage of storages()) {
    const session = read(storage)
    if (session && !isTokenExpired(session.accessToken)) return session
    storage.removeItem(KEY)
  }
  return null
}

export function saveSession(session: StoredSession, persistent: boolean) {
  clearSession()
  ;(persistent ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session))
}

export function updateStoredAccountName(accountName: string) {
  for (const storage of storages()) {
    const session = read(storage)
    if (session) storage.setItem(KEY, JSON.stringify({ ...session, accountName }))
  }
}

export function clearSession() {
  for (const storage of storages()) storage.removeItem(KEY)
}
