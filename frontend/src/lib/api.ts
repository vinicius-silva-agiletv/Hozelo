/**
 * Cliente HTTP da API do Hozelo.
 *
 * - Em desenvolvimento, `/api/*` passa pelo proxy do Vite até a API .NET (vite.config.ts).
 * - O token vem do provedor registrado pela sessão (`setTokenProvider`) e vai no header Authorization.
 * - 401 numa requisição que enviou token chama o handler da sessão (sessão expirada/inválida).
 *   O login devolve 401 para senha errada, mas não envia token, então não encerra sessão nenhuma.
 * - Erros da API vêm como `{ "errors": [...] }` e viram `ApiError`; falha de rede vira status 0.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export const NETWORK_ERROR_MESSAGE = 'Não foi possível conectar. Verifique sua conexão e tente novamente.'

export class ApiError extends Error {
  readonly status: number
  readonly messages: string[]

  constructor(status: number, messages: string[]) {
    super(messages[0] ?? `Erro ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.messages = messages
  }
}

let getToken: () => string | null = () => null
let onUnauthorized: (() => void) | null = null

export function setTokenProvider(provider: () => string | null) {
  getToken = provider
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

/** Mensagens para exibir ao usuário a partir de qualquer erro. */
export function errorMessages(error: unknown): string[] {
  if (error instanceof ApiError) return error.messages.length > 0 ? error.messages : [error.message]
  return ['Ocorreu um erro inesperado. Tente novamente.']
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getToken()

  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, [NETWORK_ERROR_MESSAGE])
  }

  if (!response.ok) {
    let messages: string[] = []
    try {
      const data = (await response.json()) as { errors?: string[] }
      messages = data.errors ?? []
    } catch {
      // resposta sem corpo JSON
    }

    if (response.status === 401 && token) onUnauthorized?.()

    throw new ApiError(response.status, messages)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
}
