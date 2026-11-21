import { PageHeader } from '@/components/shared/page-header'
import { CategoriesSection } from '@/features/categories/components/categories-section'
import { OpeningBalanceSection } from '@/features/opening-balance/components/opening-balance-section'
import { useDocumentTitle } from '@/lib/use-document-title'

import { AccountSection } from '../components/account-section'

/** Configurações (/configuracoes): categorias, saldo inicial e conta. */
export function SettingsPage() {
  useDocumentTitle('Configurações')

  return (
    <div className="space-y-8">
      <PageHeader title="Configurações" description="Categorias, saldo inicial e conta." />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <CategoriesSection />
        <div className="space-y-6">
          <OpeningBalanceSection />
          <AccountSection />
        </div>
      </div>
    </div>
  )
}
