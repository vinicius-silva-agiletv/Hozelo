import { Wallet } from 'lucide-react'

export function Brand() {
  return (
    <span className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Wallet className="size-4" aria-hidden />
      </span>
      Hozelo
    </span>
  )
}
