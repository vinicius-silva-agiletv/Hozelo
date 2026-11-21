import { vi } from 'vitest'

export type Reply = { status: number; body?: unknown }
export type Handler = Reply | ((init: RequestInit) => Reply)
export type Routes = Record<string, Handler>

/**
 * Simula a API: chaves "MÉTODO /caminho" (sem o prefixo /api) → resposta.
 * Rotas não mapeadas respondem 500, para o teste falhar de forma clara.
 */
export function mockApi(routes: Routes) {
  const calls: { key: string; init: RequestInit }[] = []

  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const key = `${init.method ?? 'GET'} ${url.replace(/^\/api/, '')}`
    calls.push({ key, init })

    const handler = routes[key]
    const reply = handler === undefined
      ? { status: 500, body: { errors: [`Rota não simulada: ${key}`] } }
      : typeof handler === 'function' ? handler(init) : handler

    return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
      status: reply.status,
      headers: { 'Content-Type': 'application/json' },
    })
  })

  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock, calls }
}

const base64url = (value: object) =>
  btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

/** JWT falso com `exp` relativo a agora (segundos). */
export function fakeToken(expiresInSeconds = 3600) {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds
  return `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url({ sid: 'x', exp })}.assinatura`
}

/** Grava uma sessão válida como se a pessoa já tivesse entrado. */
export function storeSession(accountName = 'Família Silva', persistent = true) {
  const token = fakeToken()
  ;(persistent ? localStorage : sessionStorage).setItem(
    'hozelo.session',
    JSON.stringify({ accessToken: token, accountName }),
  )
  return token
}

/** Corpo JSON enviado numa chamada simulada. */
export const bodyOf = (init: RequestInit) => (init.body ? JSON.parse(init.body as string) : undefined)
