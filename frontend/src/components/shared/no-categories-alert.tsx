import { Info } from 'lucide-react'
import { Link } from 'react-router'

import { Alert, AlertDescription } from '@/components/ui/alert'
import type { CategoryType } from '@/types/api'

/** Sem categorias do tipo: aviso com atalho para Configurações (features 007 e 008). */
export function NoCategoriesAlert({ type }: { type: CategoryType }) {
  return (
    <Alert>
      <Info aria-hidden />
      <AlertDescription>
        {`Crie uma categoria de ${type === 'Income' ? 'receita' : 'despesa'} antes de cadastrar.`}{' '}
        <Link to="/configuracoes" className="font-medium text-foreground underline underline-offset-4">
          Ir para Configurações
        </Link>
      </AlertDescription>
    </Alert>
  )
}
