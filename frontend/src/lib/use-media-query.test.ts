import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mockViewport } from '@/test/media'

import { DESKTOP_QUERY, useMediaQuery } from './use-media-query'

afterEach(() => vi.restoreAllMocks())

describe('useMediaQuery', () => {
  it('acompanha a largura da tela', () => {
    const viewport = mockViewport(360)
    const { result } = renderHook(() => useMediaQuery(DESKTOP_QUERY))
    expect(result.current).toBe(false)

    act(() => viewport.resize(1280))
    expect(result.current).toBe(true)
  })
})
