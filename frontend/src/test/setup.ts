import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, vi } from 'vitest'

// Telas carregadas sob demanda e testes em paralelo: dá mais folga às esperas (findBy/waitFor).
configure({ asyncUtilTimeout: 3000 })

afterEach(() => {
  cleanup()
  toast.dismiss()
  localStorage.clear()
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

// jsdom não implementa matchMedia (usado pelo tema) nem algumas APIs usadas pelo Radix.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.releasePointerCapture = () => {}
}
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {}

if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
