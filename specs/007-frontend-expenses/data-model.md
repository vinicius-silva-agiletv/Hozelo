# Data Model: Tela de Despesas

**Feature**: `007-frontend-expenses` | **Date**: 2026-11-21

Sem dados novos no servidor. Tipos dos contratos consumidos, validações dos formulários, estado no
endereço e prévias. Decisões em [research.md](research.md) (R§n).

## Tipos (`src/types/api.ts`)

```ts
type AmountType = 'Total' | 'Installment'
type ExpenseStatus = 'Open' | 'Paid'

interface CategorySummary { id: number; name: string }
interface PersonSummary { id: number; name: string }

interface ResponseMonthlyInstallment {
  expenseId: number; expenseName: string; category: CategorySummary
  number: number; installmentsCount: number; dueDate: string; amount: number
  isPaid: boolean; paidOn: string | null; paidAmount: number | null
  prepaid: boolean        // amortizada
  paidInAdvance: boolean  // paga em mês anterior ao vencimento (aparece no mês do pagamento)
}
interface ResponseMonthlyInstallments {
  year: number; month: number; totalAmount: number; paidAmount: number; openAmount: number
  installments: ResponseMonthlyInstallment[]
}

interface ResponseShortExpense {
  id: number; name: string; category: CategorySummary; amountType: AmountType
  totalAmount: number; installmentAmount: number; isInstallment: boolean
  installmentsCount: number; paidInstallments: number; remainingInstallments: number
  firstDueDate: string; lastDueDate: string; nextDueDate: string | null
  paidAmount: number; discountAmount: number; remainingAmount: number
  status: ExpenseStatus; notes: string | null
  person: PersonSummary | null; personPercent: number | null
}
interface ResponseExpenses {
  totalPaidAmount: number; totalRemainingAmount: number; totalDiscountAmount: number
  expenses: ResponseShortExpense[]
}
interface ResponseInstallment {
  number: number; dueDate: string; amount: number; isPaid: boolean
  paidOn: string | null; paidAmount: number | null; prepaid: boolean
}
interface ResponseExpense extends ResponseShortExpense { installments: ResponseInstallment[] }

interface RequestUpdateExpense {
  name: string; categoryId: number; amountType: AmountType; amount: number
  isInstallment: boolean; installmentsCount: number; firstDueDate: string
  notes: string | null; personId: number | null; personPercent: number | null
}
interface RequestRegisterExpense extends RequestUpdateExpense { alreadyPaidInstallments: number }
interface RequestPayInstallment { paidOn?: string }
interface RequestAmortizeExpense {
  installmentNumbers?: number[]; quantity?: number; paidOn?: string; paidAmount: number
}

interface ResponsePerson { id: number; name: string; balanceUntilNow: number; currentMonthDue: number }
interface ResponsePeople { people: ResponsePerson[] }
```

## ExpenseForm (Zod, `features/expenses/schemas.ts`)

| Campo | Tipo | Regras | Mensagem |
|---|---|---|---|
| name | `string` | trim; obrigatório; até 100 | "Informe o nome da despesa." / "O nome deve ter no máximo 100 caracteres." |
| categoryId | `number \| null` | obrigatório | "Escolha a categoria." |
| amountType | `'Total' \| 'Installment'` | padrão `Total` | — |
| amount | `number` | > 0 (vem do `MoneyInput`) | "Informe um valor maior que zero." |
| isInstallment | `boolean` | padrão `false` | — |
| installmentsCount | `number` | 1 quando à vista; 2–480 quando parcelado | "Informe de 2 a 480 parcelas." |
| firstDueDate | `string` `yyyy-MM-dd` | obrigatório; padrão R§5 `defaultFirstDueDate` | "Informe o primeiro vencimento." |
| alreadyPaidInstallments | `number` | só no cadastro; 0 até `installmentsCount`; sugestão FR-018 | "Informe de 0 até a quantidade de parcelas." |
| notes | `string` | até 500; vazio → `null` | "A observação deve ter no máximo 500 caracteres." |
| splitWithPerson | `boolean` | padrão `false` | — |
| personId | `number \| null` | obrigatório quando `splitWithPerson` | "Escolha a pessoa." |
| shareMode | `'full' \| 'percent'` | padrão `full` | — |
| personPercent | `number \| null` | 1–100 quando `shareMode = percent` | "Informe um percentual de 1 a 100." |

Envio: `installmentsCount = isInstallment ? installmentsCount : 1`; sem pessoa → `personId` e
`personPercent` `null`; integral → `personPercent = 100`. Na edição, os valores iniciais vêm da
despesa (`amountType` decide se o campo mostra `totalAmount` ou `installmentAmount`).

## PayOnDateForm

| Campo | Regras | Mensagem |
|---|---|---|
| paidOn | `yyyy-MM-dd`; obrigatório; não futura | "Informe a data do pagamento." / "A data não pode ser futura." |

## AmortizeForm

| Campo | Regras | Mensagem |
|---|---|---|
| mode | `'last' \| 'pick'`; padrão `last` | — |
| quantity | `last`: 1 até as parcelas em aberto | "Informe de 1 a N parcelas." |
| installmentNumbers | `pick`: ao menos 1, só em aberto | "Escolha ao menos uma parcela." |
| paidOn | obrigatório; não futura; padrão hoje | "A data não pode ser futura." |
| paidAmount | > 0 e ≤ soma das escolhidas; padrão a soma | "O valor pago deve ser maior que zero e no máximo R$ X." |

## Estado no endereço (`use-expenses-url.ts`)

| Parâmetro | Valores | Padrão / inválido |
|---|---|---|
| `aba` | `mes`, `todas` | `mes` |
| `mes` | `yyyy-MM` entre 2000-01 e 2100-12 | mês atual |
| `categoria` | id de categoria de despesa | todas (id desconhecido também) |
| `situacao` | `abertas`, `quitadas` (só aba Todas) | todas |
| `despesa` | id da despesa com detalhe aberto | fechado |

## Prévias (`features/expenses/preview.ts`, R§5)

| Função | Exemplo |
|---|---|
| `splitInstallments(10000, 3)` | `{ installment: 3333, last: 3334 }` |
| `totalFromInstallment(100000, 48)` | `4800000` |
| `installmentDueDate('2026-01-31', 2)` | `'2026-02-28'` |
| `suggestedPaidCount('2023-05-15', 48, '2026-11-21')` | `42` |
| `defaultFirstDueDate('2027-02', '2026-11-30')` | `'2027-02-28'` |
| `amortizationPreview([100000×6], 540000)` | `{ sum: 600000, discount: 60000 }` |
| `personShare(35000, 50)` | `17500` |

## Chaves de cache (`src/lib/query-keys.ts`)

| Chave | Dado | Atualizada por |
|---|---|---|
| `['installments', month, categoryId]` | visão do mês | invalidada em toda mutação de despesa |
| `['expenses', { categoryId, status }]` | visão Todas | invalidada em toda mutação de despesa |
| `['expense', id]` | detalhe | gravada com a resposta de pagar/desfazer/amortizar/editar; removida ao remover |
| `['people']` | pessoas para o seletor | — |
| `['categories']` | contagens | invalidada ao cadastrar, editar e remover |
