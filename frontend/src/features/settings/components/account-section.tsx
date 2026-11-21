import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useProfile } from '@/features/auth/hooks'
import { useSession } from '@/features/auth/use-session'

/** Seção Conta: nome e e-mail (somente leitura) e Sair (FR-010). */
export function AccountSection() {
  const profile = useProfile()
  const { signOut } = useSession()

  return (
    <section aria-labelledby="account-title">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            <h2 id="account-title">Conta</h2>
          </CardTitle>
          <CardDescription>Conta compartilhada pela família.</CardDescription>
        </CardHeader>
        <CardContent>
          {profile.data ? (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Nome</dt>
                <dd className="font-medium break-words">{profile.data.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">E-mail</dt>
                <dd className="font-medium break-all">{profile.data.email}</dd>
              </div>
            </dl>
          ) : (
            <div className="space-y-3" aria-label="Carregando conta">
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-9 w-3/4" />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={signOut}>
            <LogOut aria-hidden />
            Sair
          </Button>
        </CardFooter>
      </Card>
    </section>
  )
}
