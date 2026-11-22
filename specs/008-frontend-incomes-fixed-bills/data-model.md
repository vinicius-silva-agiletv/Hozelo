# Data Model: Telas de Receitas e Contas Fixas

**Feature**: `008-frontend-incomes-fixed-bills` | **Date**: 2026-11-21

Sem dados novos no servidor. Tipos dos contratos consumidos, validações dos formulários, estado no
endereço e derivações da tela. Decisões em [research.md](research.md) (R§n).

## Tipos (`src/types/api.ts`)

```ts
type EntryKind = 'Expense' | 'Income'
type LedgerSource = 'Installment' | 'Income' | 'Recurrence' | 'Reimbursement'

interface ResponseIncome {
  id: number; name: string; category: CategorySummary; amount: number
  expectedDate: string; isReceived: boolean; receivedOn: string | null; notes: string | null
}
interface ResponseIncomes { incomes: ResponseIncome[] }
interface RequestUpdateIncome { name: string; categoryId: number; amount: number; expectedDate: string; notes: string | null }
interface RequestIncome extends RequestUpdateIncome { receivedOn?: string | null }

interface ResponseShortRecurrence {
  id: number; kind: EntryKind; name: string; category: CategorySummary; dayOfMonth: number
  startMonth: string; endMonth: string | null; isActive: boolean; currentAmount: number
  notes: string | null; person: PersonSummary | null; personPercent: number | null
}
interface ResponseRecurrenceAmount { fromMonth: string; amount: number }
interface ResponseRecurrenceMonth { month: string; amount: number | null; skipped: boolean; settledOn: string | null }
interface ResponseRecurrence extends ResponseShortRecurrence {
  amounts: ResponseRecurrenceAmount[]; months: ResponseRecurrenceMonth[]
}
interface ResponseRecurrences { recurrences: ResponseShortRecurrence[] }
interface RequestUpdateRecurrence {
  name: string; categoryId: number; dayOfMonth: number; notes: string | null
  personId: number | null; personPercent: number | null
}
interface RequestRecurrence extends RequestUpdateRecurrence {
  kind: EntryKind; amount: number; startMonth: string; endMonth: string | null
}

interface ResponseLedgerItem {
  source: LedgerSource; sourceId: number; direction: EntryKind
  number: number | null; installmentsCount: number | null; name: string
  category: CategorySummary | null; month: string; date: string; amount: number
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

## IncomeForm (Zod, `features/incomes/schemas.ts`) — modo Avulsa

| Campo | Regras | Mensagem |
|---|---|---|
| name | trim; obrigatório; até 100 | "Informe o nome da receita." / "O nome deve ter no máximo 100 caracteres." |
| categoryId | obrigatório (categoria de receita) | "Escolha a categoria." |
| amount | > 0 | "Informe um valor maior que zero." |
| expectedDate | data válida; padrão dia de hoje no mês aberto | "Informe a data prevista." |
| alreadyReceived | `boolean`, padrão `false` (só no cadastro) | — |
| receivedOn | quando `alreadyReceived`: data válida não futura; padrão hoje | "A data não pode ser futura." |
| notes | até 500; vazio → `null` | "A observação deve ter no máximo 500 caracteres." |

## RecurrenceForm (Zod, `features/recurrences/schemas.ts`) — modo Todo mês e Conta fixa

| Campo | Regras | Mensagem |
|---|---|---|
| name | trim; obrigatório; até 100 | "Informe o nome." / "O nome deve ter no máximo 100 caracteres." |
| categoryId | obrigatório (categoria do tipo) | "Escolha a categoria." |
| amount | > 0 (só no cadastro) | "Informe um valor maior que zero." |
| dayOfMonth | inteiro 1–31; padrão dia de hoje | "Informe um dia de 1 a 31." |
| startMonth | `yyyy-MM`; padrão mês aberto (só no cadastro) | — |
| hasEnd / endMonth | quando `hasEnd`: `endMonth ≥ startMonth` (só no cadastro) | "O fim não pode ser antes do início." |
| notes | até 500 | "A observação deve ter no máximo 500 caracteres." |
| splitWithPerson / personId / shareMode / personPercent | só despesa; mesmas regras de ExpenseForm (007) | "Escolha a pessoa." / "Informe um percentual de 1 a 100." |

## Formulários de ajuste

| Formulário | Campos e regras | Mensagens |
|---|---|---|
| AdjustMonthForm | `amount` > 0 | "Informe um valor maior que zero." |
| SettleWithAmountForm | `amount` > 0; `settledOn` não futura (padrão hoje) | idem / "A data não pode ser futura." |
| SettleOnDateForm | `settledOn` não futura | "A data não pode ser futura." |
| ChangeAmountForm | `amount` > 0; `fromMonth ≥ startMonth` (padrão mês aberto) | "Informe um valor maior que zero." / "O mês não pode ser antes do início." |
| EndForm | `endMonth ≥ startMonth` (padrão mês aberto) | "O fim não pode ser antes do início." |

## Derivações da tela (`features/recurrences/occurrence.ts`)

| Função | Regra |
|---|---|
| `isActiveIn(recurrence, month)` | `startMonth ≤ month` e (`endMonth` nulo ou `month ≤ endMonth`) |
| `normalAmount(recurrence, month)` | valor do último `amounts[].fromMonth ≤ month` |
| `monthRecord(recurrence, month)` | `months[]` do mês, se houver |
| `occurrenceState(recurrence, ledgerItem?, month)` | `skipped` (registro pulado) · `settled` (item quitado) · `open`; `adjusted` quando o registro tem `amount` |
| `fixedBillTotals(rows)` | previsto/pago/a pagar a partir dos itens do resumo (sem puladas) |

## Estado no endereço (`lib/use-month-url.ts`)

| Tela | Parâmetros | Padrão / inválido |
|---|---|---|
| Receitas | `mes`, `categoria`, `receita` (avulsa aberta), `recorrencia` | mês atual; categoria desconhecida → todas |
| Contas fixas | `mes`, `recorrencia` | mês atual |

## Chaves de cache (`src/lib/query-keys.ts`)

| Chave | Dado | Invalidada por |
|---|---|---|
| `['summary', month, categoryId]` | resumo do mês | toda mutação de receita, recorrência e despesa |
| `['incomes']` / `['income', id]` | avulsas | mutações de avulsa |
| `['recurrences', kind]` / `['recurrence', id]` | recorrências | mutações de recorrência (o detalhe é gravado com a resposta) |
| `['categories']` | contagens | cadastrar, editar e remover |
