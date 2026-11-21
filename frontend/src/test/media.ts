import { vi } from 'vitest'

/**
 * Simula a largura da tela para `matchMedia` ('(min-width: Npx)'). Devolve `resize` para mudar a
 * largura e avisar os ouvintes, como o navegador faz.
 */
export function mockViewport(width: number) {
  let current = width
  const listeners = new Set<() => void>()

  const spy = vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
    const min = Number(/min-width:\s*(\d+)px/.exec(query)?.[1] ?? 0)
    return {
      get matches() {
        return current >= min
      },
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
      dispatchEvent: () => false,
    } as unknown as MediaQueryList
  })

  return {
    resize(next: number) {
      current = next
      listeners.forEach((listener) => listener())
    },
    restore: () => spy.mockRestore(),
  }
}
