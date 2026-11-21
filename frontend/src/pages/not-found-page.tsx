import { SearchX } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/use-document-title'

export function NotFoundPage() {
  useDocumentTitle('Página não encontrada')

  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-md">
        <EmptyState
          icon={SearchX}
          title="Página não encontrada"
          description="O endereço acessado não existe ou foi alterado."
          action={
            <Button asChild>
              <Link to="/">Voltar ao início</Link>
            </Button>
          }
        />
      </div>
    </main>
  )
}
