import { formatCurrency } from '@/lib/format'
import type { ChargeOriginType, ChargeStatus, ResponsePersonChargeItem } from '@/types/api'

/** data-model.md "Exibição". */
export const originLabel: Record<ChargeOriginType, string> = {
  Expense: 'despesa',
  Recurrence: 'conta fixa',
  Manual: 'avulsa',
}

export const chargeLabel = (charge: Pick<ResponsePersonChargeItem, 'description' | 'number' | 'count'>) =>
  charge.count && charge.count > 1 && charge.number ? `${charge.description} · ${charge.number}/${charge.count}` : charge.description

export const statusLabel = (status: ChargeStatus, remaining: number) =>
  status === 'Paid' ? 'paga' : status === 'Partial' ? `parcial · falta ${formatCurrency(remaining)}` : 'em aberto'

/** Despesa e conta fixa abrem o detalhe na tela delas (FR-005). */
export const originLink = (type: ChargeOriginType, id: number) =>
  type === 'Expense' ? `/despesas?despesa=${id}` : type === 'Recurrence' ? `/contas-fixas?recorrencia=${id}` : null
