import type { EntryKind } from '@/types/api'

/** Palavras que mudam entre receita (receber) e despesa (pagar). */
export const kindWords: Record<
  EntryKind,
  { act: string; done: string; open: string; settledMsg: string; undoneMsg: string; dateLabel: string }
> = {
  Income: {
    act: 'Receber',
    done: 'Recebida',
    open: 'A receber',
    settledMsg: 'Receita marcada como recebida.',
    undoneMsg: 'Recebimento desfeito.',
    dateLabel: 'Data do recebimento',
  },
  Expense: {
    act: 'Pagar',
    done: 'Paga',
    open: 'Em aberto',
    settledMsg: 'Conta marcada como paga.',
    undoneMsg: 'Pagamento desfeito.',
    dateLabel: 'Data do pagamento',
  },
}
