import { Loader2 } from 'lucide-react'

/** Indicador enquanto o código de uma tela é baixado (research.md §9). */
export function PageLoader() {
  return (
    <div role="status" className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      Carregando...
    </div>
  )
}
