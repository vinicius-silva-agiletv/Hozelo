import { afterEach, describe, expect, it, vi } from 'vitest'

import { api, ApiError, errorMessages, NETWORK_ERROR_MESSAGE, setTokenProvider, setUnauthorizedHandler } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/format'

const jsonResponse = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('api', () => {
  afterEach(() => {
    setTokenProvider(() => null)
    setUnauthorizedHandler(null)
  })

  it('envia o token do provedor e o corpo em JSON para /api', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { id: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    setTokenProvider(() => 'abc')

    await expect(api.post('/categories', { name: 'Luz' })).resolves.toEqual({ id: 1 })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/categories')
    expect(init.headers.Authorization).toBe('Bearer abc')
    expect(init.body).toBe(JSON.stringify({ name: 'Luz' }))
  })

  it('converte o formato de erro da API em ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(409, { errors: ['Já existe.'] })))

    const error = (await api.post('/categories', {}).catch((e: unknown) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(409)
    expect(errorMessages(error)).toEqual(['Já existe.'])
  })

  it('401 com token chama o handler de sessão; sem token não chama', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => jsonResponse(401, { errors: ['E-mail e/ou senha inválidos.'] })))

    await api.post('/login', {}).catch(() => {})
    expect(handler).not.toHaveBeenCalled()

    setTokenProvider(() => 'abc')
    await api.get('/users').catch(() => {})
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('falha de rede vira ApiError status 0 com mensagem amigável', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = (await api.get('/users').catch((e: unknown) => e)) as ApiError

    expect(error.status).toBe(0)
    expect(error.message).toBe(NETWORK_ERROR_MESSAGE)
  })

  it('devolve undefined para 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    await expect(api.delete('/categories/1')).resolves.toBeUndefined()
  })
})

describe('format', () => {
  it('formata reais e datas no padrão brasileiro', () => {
    expect(formatCurrency(1250.5).replace(/\s/g, ' ')).toBe('R$ 1.250,50')
    expect(formatDate('2026-11-21')).toBe('21/11/2026')
  })
})
