import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { errorMessages } from '@/lib/api'

interface PaymentToggleProps {
  isPaid: boolean
  /** Nome acessível (ex.: "Geladeira, parcela 3 de 10"). */
  label: string
  /** Envia a mudança; a promessa termina depois que as listas foram recarregadas. */
  onToggle: (paid: boolean) => Promise<unknown>
  messages: { paid: string; unpaid: string }
  /** Textos do estado ("Paga"/"Em aberto", "Recebida"/"A receber"). */
  states?: { on: string; off: string }
  /** Pede confirmação antes de desfazer (ex.: parcela amortizada). */
  confirmUndo?: { title: string; description: string; confirmLabel: string }
  disabled?: boolean
}

/**
 * Caixa de pago/recebido (features 007 e 008): muda na hora, fica travada até a tela mostrar o novo
 * estado (toque duplo não envia de novo) e, se a API recusar, volta e mostra a mensagem.
 */
export function PaymentToggle({
  isPaid,
  label,
  onToggle,
  messages,
  states = { on: 'Paga', off: 'Em aberto' },
  confirmUndo,
  disabled = false,
}: PaymentToggleProps) {
  const [pending, setPending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  // Trava síncrona: só destrava quando a caixa já mostra o estado pedido (ou a API recusou), para
  // um segundo toque nunca partir de um estado desatualizado.
  const busy = useRef(false)
  const expected = useRef<boolean | null>(null)
  useEffect(() => {
    if (!pending && (expected.current === null || expected.current === isPaid)) {
      busy.current = false
      expected.current = null
    }
  }, [pending, isPaid])

  const send = async (paid: boolean) => {
    busy.current = true
    expected.current = paid
    setPending(true)
    try {
      await onToggle(paid)
      toast.success(paid ? messages.paid : messages.unpaid)
    } catch (error) {
      expected.current = null
      toast.error(errorMessages(error).join(' '))
    } finally {
      setConfirming(false)
      setPending(false)
    }
  }

  return (
    <>
      <Checkbox
        checked={isPaid}
        disabled={pending || disabled}
        aria-label={`${isPaid ? states.on : states.off}: ${label}`}
        className="size-5"
        onCheckedChange={(checked) => {
          if (busy.current) return
          if (checked !== true && confirmUndo) setConfirming(true)
          else void send(checked === true)
        }}
      />
      {confirmUndo && (
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={confirmUndo.title}
          description={confirmUndo.description}
          confirmLabel={confirmUndo.confirmLabel}
          destructive
          pending={pending}
          onConfirm={() => void send(false)}
        />
      )}
    </>
  )
}
