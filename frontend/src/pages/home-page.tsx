import { ArrowDownCircle, ArrowUpCircle, PiggyBank, Wallet } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'

/**
 * Página provisória: confirma que Tailwind, shadcn/ui, ícones, tema e avisos estão funcionando.
 * Será substituída pelas telas reais (login, resumo do mês, despesas...).
 */
const cards = [
  { title: 'Entradas', value: 8500, icon: ArrowUpCircle, tone: 'text-emerald-600 dark:text-emerald-400' },
  { title: 'Saídas', value: 6120, icon: ArrowDownCircle, tone: 'text-rose-600 dark:text-rose-400' },
  { title: 'Saldo do mês', value: 2380, icon: Wallet, tone: 'text-foreground' },
  { title: 'Acumulado', value: 10700, icon: PiggyBank, tone: 'text-foreground' },
]

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <Badge variant="secondary">Frontend em construção</Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Hozelo</h1>
          <p className="text-muted-foreground">Finanças da família, sem planilha.</p>
        </div>
        <Button onClick={() => toast.success('Tudo pronto para começar as telas!')}>Testar aviso</Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Exemplo de resumo do mês">
        {cards.map(({ title, value, icon: Icon, tone }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardDescription>{title}</CardDescription>
              <Icon className={`size-5 ${tone}`} aria-hidden />
            </CardHeader>
            <CardContent>
              <CardTitle className={`text-2xl ${tone}`}>{formatCurrency(value)}</CardTitle>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}
