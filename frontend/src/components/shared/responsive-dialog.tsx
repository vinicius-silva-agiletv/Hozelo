import { createContext, useContext, type ReactNode } from 'react'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { DESKTOP_QUERY, useMediaQuery } from '@/lib/use-media-query'

const DesktopContext = createContext(true)

interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  children: ReactNode
  /** Mais largo no computador (ex.: detalhe com lista de parcelas). */
  wide?: boolean
}

/**
 * Painel de formulário (research.md §4): diálogo centralizado a partir de 768 px e painel vindo de
 * baixo no celular. Feche-o pelo `onOpenChange` (Esc, clique fora ou botão "Cancelar" do formulário).
 */
export function ResponsiveDialog({ open, onOpenChange, title, description, children, wide = false }: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  if (isDesktop) {
    return (
      <DesktopContext.Provider value>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent showCloseButton={false} className={cn('max-h-[90dvh] overflow-y-auto', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description ? <DialogDescription>{description}</DialogDescription> : <DialogDescription className="sr-only">{title}</DialogDescription>}
            </DialogHeader>
            {children}
          </DialogContent>
        </Dialog>
      </DesktopContext.Provider>
    )
  }

  return (
    <DesktopContext.Provider value={false}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" showCloseButton={false} className="max-h-[90dvh] gap-0 overflow-y-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : <SheetDescription className="sr-only">{title}</SheetDescription>}
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-4">{children}</div>
        </SheetContent>
      </Sheet>
    </DesktopContext.Provider>
  )
}

/** Rodapé com as ações do formulário (botões empilhados no celular, à direita no computador). */
export function ResponsiveDialogFooter({ className, children }: { className?: string; children: ReactNode }) {
  const isDesktop = useContext(DesktopContext)
  if (isDesktop) return <DialogFooter className={className}>{children}</DialogFooter>
  return <div className={cn('flex flex-col-reverse gap-2 pt-2', className)}>{children}</div>
}
