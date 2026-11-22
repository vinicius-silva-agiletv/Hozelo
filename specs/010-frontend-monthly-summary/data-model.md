# Data Model: Tela de Resumo do Mês

**Feature**: `010-frontend-monthly-summary` | **Date**: 2026-11-22

Sem dados novos no servidor nem tipos novos: usa `ResponseMonthlySummary` e `ResponseLedgerItem`
(já em `src/types/api.ts`, feature 008). Decisões em [research.md](research.md) (R§n).

## Tipos usados

```ts
// já existentes
interface ResponseLedgerItem {
  source: 'Installment' | 'Income' | 'Recurrence' | 'Reimbursement'
  sourceId: number          // despesa | receita avulsa | recorrência | pessoa (R§2)
  direction: 'Income' | 'Expense'
  number: number | null; installmentsCount: number | null
  name: string; category: CategorySummary | null
  month: string; date: string; amount: number
  isSettled: boolean; settledAmount: number | null; settledOn: string | null; paidInAdvance: boolean
}
interface ResponseMonthlySummary {
  year: number; month: number
  incomes: ResponseLedgerItem[]; expenses: ResponseLedgerItem[]
  forecast: { incomes: number; expenses: number; balance: number }
  realized: { received: number; paid: number; balance: number }
  pending: { toReceive: number; toPay: number; items: ResponseLedgerItem[] } | null
  accumulated: { previousBalance: number; endBalance: number } | null
  openingBalanceMissing: boolean
}
```

## Derivações de exibição (`features/summary/ledger.ts`)

| Função | Regra |
|---|---|
| `ledgerLink(item)` | `Installment` → `/despesas?despesa={sourceId}`; `Income` → `/receitas?receita={sourceId}`; `Recurrence` + `Income` → `/receitas?recorrencia={sourceId}`; `Recurrence` + `Expense` → `/contas-fixas?recorrencia={sourceId}`; `Reimbursement` → `/pessoas/{sourceId}?mes={month}` |
| `ledgerShownAmount(item)` | quitado → `settledAmount ?? amount`; parcial (`settledAmount < amount`) → pago + "de" total |
| `ledgerLabel(item)` | nome + " · n/total" quando `installmentsCount > 1` |
| `heroOf(summary, month, categoryId)` | com `accumulated`: título "Saldo no fim do mês", valor `endBalance`, `previousBalance`, `forecast.balance`, legenda projeção (mês ≥ atual) / realizado (mês < atual); sem `accumulated`: título "Saldo previsto do mês", valor `forecast.balance`, motivo `missing` (sem saldo inicial) / `filtered` (com categoria) / `beforeStart` |

## Estado no endereço

| Parâmetro | Valores | Padrão / inválido |
|---|---|---|
| `mes` | `yyyy-MM` (2000-01..2100-12) | mês atual |
| `categoria` | id de categoria de despesa ou receita | todas (desconhecida → todas) |
| `lista` | `entradas`, `saidas` | `entradas` |

## Cache

| Chave | Atualizada por |
|---|---|
| `['summary', month, categoryId]` | toda mutação de despesas, receitas, recorrências e pessoas (já invalidam `['summary']`) |
