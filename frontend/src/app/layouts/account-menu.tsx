import { LogOut } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/use-session'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?'

/** Nome da conta (encurtado quando longo) e botão de sair. */
export function AccountMenu({ onSignOut }: { onSignOut?: () => void }) {
  const { accountName, signOut } = useSession()
  const name = accountName ?? ''

  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-8">
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 truncate text-sm font-medium" title={name}>
        {name}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          onSignOut?.()
          signOut()
        }}
      >
        <LogOut aria-hidden />
        Sair
      </Button>
    </div>
  )
}
