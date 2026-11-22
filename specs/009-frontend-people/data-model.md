# Data Model: Tela de Pessoas

**Feature**: `009-frontend-people` | **Date**: 2026-11-21

Sem dados novos no servidor. Tipos consumidos, validações, endereço e cache. Decisões em
[research.md](research.md) (R§n).

## Tipos (`src/types/api.ts`)

```ts
type ChargeOriginType = 'Expense' | 'Recurrence' | 'Manual'
type ChargeStatus = 'Open' | 'Partial' | 'Paid'

// ResponsePerson / ResponsePeople já existem (007): id, name, balanceUntilNow, currentMonthDue
interface RequestPerson { name: string }

interface RequestPersonCharge { description: string; amount: number; chargeDate: string; notes: null }
interface ResponsePersonCharge { id: number; key: string; description: string; amount: number; chargeDate: string; notes: string | null }

interface RequestPersonPayment { amount: number; paidOn: string; notes: string | null; chargeKeys?: string[] }
interface ResponsePersonPayment { id: number; amount: number; paidOn: string; notes: string | null; chargeKeys: string[] }

interface ResponsePersonChargeItem {
  key: string; originType: ChargeOriginType; originId: number; description: string
  number: number | null; count: number | null; date: string
  amount: number; paid: number; remaining: number; status: ChargeStatus
}
interface ResponsePersonStatement {
  person: PersonSummary; year: number; month: number
  previousBalance: number; charges: ResponsePersonChargeItem[]; totalCharges: number; totalDue: number
  payments: ResponsePersonPayment[]; totalPaid: number; endBalance: number   // negativo = crédito
}
interface ResponsePersonOrigin {
  originType: ChargeOriginType; originId: number; description: string
  chargesDue: number; chargesTotal: number; monthlyAmount: number | null
  total: number; paid: number; remaining: number; isOpenEnded: boolean
}
interface ResponsePersonOverview {
  person: PersonSummary; origins: ResponsePersonOrigin[]
  owedUntilNow: number; owedTotal: number; unallocatedCredit: number
}
```

## Formulários (Zod, `features/people/schemas.ts`)

| Formulário | Campo | Regras | Mensagem |
|---|---|---|---|
| PersonForm | name | trim; obrigatório; até 100 | "Informe o nome." / "O nome deve ter no máximo 100 caracteres." |
| PaymentForm | amount | > 0; padrão `currentMonthDue` se positivo | "Informe um valor maior que zero." |
| PaymentForm | paidOn | data válida; não futura; padrão hoje | "Informe a data do pagamento." / "A data não pode ser futura." |
| PaymentForm | notes | até 500; vazio → `null` | "A observação deve ter no máximo 500 caracteres." |
| PaymentForm | chargeKeys | opcional; só chaves de cobranças com `remaining > 0` (ou já do pagamento, na edição) | — |
| ChargeForm | description | trim; obrigatório; até 100 | "Informe a descrição." / "A descrição deve ter no máximo 100 caracteres." |
| ChargeForm | amount | > 0 | "Informe um valor maior que zero." |
| ChargeForm | chargeDate | data válida; padrão hoje | "Informe a data." |

## Exibição

| Regra | Onde |
|---|---|
| `formatBalance(v)`: v > 0 → "R$ X"; v < 0 → "crédito de R$ X"; 0 → "R$ 0,00" | lista, extrato, resumo |
| Situação: `Paid` → "paga"; `Partial` → "parcial · falta R$ remaining"; `Open` → "em aberto" | extrato |
| Parcela: `number/count` quando `count > 1` | extrato |
| Origem: `Expense` → "despesa" (link `/despesas?despesa=originId`); `Recurrence` → "conta fixa" (link `/contas-fixas?recorrencia=originId`); `Manual` → "avulsa" (editar/remover) | extrato, resumo |
| Resumo: "chargesDue de chargesTotal vencidas"; `isOpenEnded` → "R$ monthlyAmount por mês · sem fim" | resumo |

## Estado no endereço

| Rota | Parâmetros | Padrão / inválido |
|---|---|---|
| `/pessoas` | — | — |
| `/pessoas/:id` | `aba` (`extrato` \| `resumo`), `mes` (`yyyy-MM`) | extrato; mês atual |

## Chaves de cache (`src/lib/query-keys.ts`)

| Chave | Dado | Invalidada por |
|---|---|---|
| `['people']` | lista | mutações desta feature e de despesas/recorrências |
| `['person-statement', id, month]` | extrato | mutações da pessoa, despesas/recorrências |
| `['person-summary', id]` | resumo geral | idem |
| `['summary']` | resumo do mês (reembolsos) | pagamentos e cobranças |
