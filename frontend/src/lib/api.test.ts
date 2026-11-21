import { afterEach, describe, expect, it, vi } from 'vitest'

import { api, ApiError, tokenStorage } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/format'

const jsonResponse = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('api', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('envia o token e o corpo em JSON para /api', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { id: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    tokenStorage.set('abc')

    const result = await api.post<{ id: number }>('/categories', { name: 'Luz' })

    expect(result).toEqual({ id: 1 })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/categories')
    expect(init.headers.Authorization).toBe('Bearer abc')
    expect(init.body).toBe(JSON.stringify({ name: 'Luz' }))
  })

  it('converte o formato de erro da API em ApiError com as mensagens', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(409, { errors: ['Já existe uma categoria com esse nome.'] })))

    const error = await api.post('/categories', { name: 'Luz' }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(409)
    expect((error as ApiError).message).toBe('Já existe uma categoria com esse nome.')
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
