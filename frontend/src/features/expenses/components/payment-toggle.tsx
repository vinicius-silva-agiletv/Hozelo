import { PaymentToggle as SharedPaymentToggle } from '@/components/shared/payment-toggle'

import { useInstallmentPayment } from '../hooks'

interface PaymentToggleProps {
  expenseId: number
  number: number
  isPaid: boolean
  prepaid: boolean
  label: string
}

/** Caixa de pago de uma parcela (FR-004); desfazer amortizada pede confirmação (FR-012). */
export function PaymentToggle({ expenseId, number, isPaid, prepaid, label }: PaymentToggleProps) {
  const payment = useInstallmentPayment()
  return (
    <SharedPaymentToggle
      isPaid={isPaid}
      label={label}
      onToggle={(paid) => payment.mutateAsync({ expenseId, number, paid })}
      messages={{ paid: 'Parcela marcada como paga.', unpaid: 'Pagamento desfeito.' }}
      confirmUndo={
        prepaid
          ? {
              title: 'Desfazer pagamento?',
              description: 'Esta parcela foi amortizada. Desfazer o pagamento remove o desconto correspondente.',
              confirmLabel: 'Desfazer pagamento',
            }
          : undefined
      }
    />
  )
}
