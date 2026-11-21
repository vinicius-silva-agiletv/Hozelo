import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'

/** Mensagens de erro (vindas da API) exibidas como recebidas; `children` para uma ação extra. */
export function ApiErrorAlert({ messages, children }: { messages: string[]; children?: ReactNode }) {
  return (
    <Alert variant="destructive">
      <CircleAlert aria-hidden />
      <AlertDescription className="space-y-1">
        {messages.length === 1 ? (
          <p>{messages[0]}</p>
        ) : (
          <ul className="list-disc space-y-0.5 pl-4">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
        {children && <p>{children}</p>}
      </AlertDescription>
    </Alert>
  )
}
