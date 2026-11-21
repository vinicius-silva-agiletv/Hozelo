import { useCallback, useSyncExternalStore } from 'react'

/** `true` enquanto a media query casar (ex.: '(min-width: 768px)'); atualiza ao redimensionar. */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', notify)
      return () => list.removeEventListener('change', notify)
    },
    [query],
  )

  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}

export const DESKTOP_QUERY = '(min-width: 768px)'
