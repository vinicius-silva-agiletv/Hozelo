import { Construction } from 'lucide-react'

import type { NavArea } from '@/app/navigation'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { useDocumentTitle } from '@/lib/use-document-title'

/** Área ainda não construída (será substituída pela tela real na feature correspondente). */
export function UnderConstructionPage({ area }: { area: NavArea }) {
  useDocumentTitle(area.label)

  return (
    <div className="space-y-6">
      <PageHeader title={area.label} description={area.description} />
      <EmptyState
        icon={Construction}
        title="Em construção"
        description="Esta área será construída nas próximas etapas do Hozelo."
      />
    </div>
  )
}
