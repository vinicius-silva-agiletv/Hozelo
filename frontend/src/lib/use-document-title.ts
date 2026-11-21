import { useEffect } from 'react'

/** Título da aba: "<título> · Hozelo". */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · Hozelo` : 'Hozelo'
  }, [title])
}
