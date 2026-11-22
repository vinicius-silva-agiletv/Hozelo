import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { errorMessages } from '@/lib/api'

import { useInstallmentPayment } from '../hooks'

interface PaymentToggleProps {
  expenseId: number
  number: number
  isPaid: boolean
  prepaid: boolean
  /** Nome acessível da caixa (ex.: "Geladeira, parcela 3 de 10"). */
  label: string
}

/**
 * Caixa de pago de uma parcela (FR-004, research.md §4): muda na hora, fica travada até a resposta
 * e desfazer uma parcela amortizada pede confirmação (FR-012).
 */
export function PaymentToggle({ expenseId, number, isPaid, prepaid, label }: PaymentToggleProps) {
  const payment = useInstallmentPayment()
  const [confirmUndo, setConfirmUndo] = useState(false)
  // Trava síncrona: um segundo toque antes de a tela mostrar o novo estado não envia de novo.
  // Só destrava depois do render que já reflete a resposta (e o recarregamento das listas).
  const busy = useRef(false)
  useEffect(() => {
    if (!payment.isPending) busy.current = false
  }, [payment.isPending, isPaid])

  const send = (paid: boolean) => {
    busy.current = true
    payment.mutate(
      { expenseId, number, paid },
      {
        onSuccess: () => {
          toast.success(paid ? 'Parcela marcada como paga.' : 'Pagamento desfeito.')
          setConfirmUndo(false)
        },
        onError: (error) => {
          toast.error(errorMessages(error).join(' '))
          setConfirmUndo(false)
        },
      },
    )
  }

  return (
    <>
      <Checkbox
        checked={isPaid}
        disabled={payment.isPending}
        aria-label={`${isPaid ? 'Paga' : 'Em aberto'}: ${label}`}
        className="size-5"
        onCheckedChange={(checked) => {
          if (busy.current) return
          if (checked !== true && prepaid) setConfirmUndo(true)
          else send(checked === true)
        }}
      />
      <ConfirmDialog
        open={confirmUndo}
        onOpenChange={setConfirmUndo}
        title="Desfazer pagamento?"
        description="Esta parcela foi amortizada. Desfazer o pagamento remove o desconto correspondente."
        confirmLabel="Desfazer pagamento"
        destructive
        pending={payment.isPending}
        onConfirm={() => send(false)}
      />
    </>
  )
}
