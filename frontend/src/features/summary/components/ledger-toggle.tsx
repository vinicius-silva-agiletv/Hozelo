import { PaymentToggle } from '@/components/shared/payment-toggle'
import { useInstallmentPayment } from '@/features/expenses/hooks'
import { useIncomeReceipt } from '@/features/incomes/hooks'
import { useRecurrenceAction } from '@/features/recurrences/hooks'
import type { ResponseLedgerItem } from '@/types/api'

import { ledgerLabel } from '../ledger'

const texts = {
  Income: { states: { on: 'Recebida', off: 'A receber' }, messages: { paid: 'Marcado como recebido.', unpaid: 'Recebimento desfeito.' } },
  Expense: { states: { on: 'Paga', off: 'Em aberto' }, messages: { paid: 'Marcado como pago.', unpaid: 'Pagamento desfeito.' } },
}

/**
 * Caixa de pago/recebido de um item do resumo (research.md §4): usa a mesma operação das telas de
 * Despesas, Receitas e Contas fixas; reembolsos não têm caixa (são registrados em Pessoas).
 */
export function LedgerToggle({ item }: { item: ResponseLedgerItem }) {
  if (item.source === 'Reimbursement') return <span className="size-5 shrink-0" aria-hidden />
  if (item.source === 'Installment') return <InstallmentToggle item={item} />
  if (item.source === 'Income') return <IncomeToggle item={item} />
  return <RecurrenceToggle item={item} />
}

function Toggle({ item, onToggle }: { item: ResponseLedgerItem; onToggle: (settled: boolean) => Promise<unknown> }) {
  const words = texts[item.direction]
  return (
    <PaymentToggle isPaid={item.isSettled} label={ledgerLabel(item)} states={words.states} messages={words.messages} onToggle={onToggle} />
  )
}

function InstallmentToggle({ item }: { item: ResponseLedgerItem }) {
  const payment = useInstallmentPayment()
  return <Toggle item={item} onToggle={(paid) => payment.mutateAsync({ expenseId: item.sourceId, number: item.number ?? 1, paid })} />
}

function IncomeToggle({ item }: { item: ResponseLedgerItem }) {
  const receipt = useIncomeReceipt(item.sourceId)
  return <Toggle item={item} onToggle={(received) => receipt.mutateAsync({ received })} />
}

function RecurrenceToggle({ item }: { item: ResponseLedgerItem }) {
  const action = useRecurrenceAction(item.sourceId)
  return (
    <Toggle
      item={item}
      onToggle={(settled) => action.mutateAsync(settled ? { type: 'settle', month: item.month } : { type: 'undoSettlement', month: item.month })}
    />
  )
}
