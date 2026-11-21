import { CloudOff } from 'lucide-react'
import { Component, Suspense, type ReactNode } from 'react'
import { useLocation } from 'react-router'

import { Button } from '@/components/ui/button'

import { EmptyState } from './empty-state'
import { PageLoader } from './page-loader'

interface RouteErrorBoundaryProps {
  children: ReactNode
  /** Ação de "Tentar de novo"; por padrão recarrega a página (baixa a versão atual das telas). */
  onRetry?: () => void
}

/**
 * Falha ao baixar ou montar uma tela (ex.: sem conexão ou versão nova publicada): mostra a mensagem
 * e "Tentar de novo" no lugar da tela, mantendo o menu (research.md §9).
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <EmptyState
        icon={CloudOff}
        title="Não foi possível carregar esta tela."
        description="Verifique a conexão e tente de novo."
        action={<Button onClick={this.props.onRetry ?? (() => window.location.reload())}>Tentar de novo</Button>}
      />
    )
  }
}

/** Tela carregada sob demanda: indicador enquanto baixa e tratamento de falha; reinicia ao trocar de rota. */
export function RouteBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <RouteErrorBoundary key={pathname}>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </RouteErrorBoundary>
  )
}
