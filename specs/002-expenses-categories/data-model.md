# Data Model: Despesas e Categorias

**Feature**: `002-expenses-categories` | **Date**: 2026-11-21

Nomes em inglês, `snake_case` no PostgreSQL. Dinheiro em `numeric(12,2)`; datas de calendário
em `date`; `created_on` em `timestamptz` (UTC). Decisões em [research.md](research.md).

```text
users 1 ──── * categories 1 ──── * expenses 1 ──── * expense_installments
users 1 ──────────────────────── * expenses
```

## Category (`categories`)

Herda `EntityBase` (`id`, `created_on`, `active`).

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| UserId | `long` | `user_id bigint` FK → `users.id` | dono; preenchido com o usuário autenticado |
| Name | `string` | `name varchar(50)` | obrigatório; salvo sem espaços nas pontas; 1–50 caracteres; único por usuário ignorando maiúsculas/minúsculas |

**Índices**: `ux_categories_user_name` único em `(user_id, lower(name))`.

**Validação (FluentValidation)**

| Regra | Mensagem (pt-BR) |
|---|---|
| Nome vazio ou só espaços | "O nome da categoria não pode estar vazio." |
| Nome > 50 caracteres | "O nome da categoria deve ter no máximo 50 caracteres." |

**Regras de negócio (use case)**

| Regra | HTTP | Mensagem |
|---|---|---|
| Nome já usado (criar ou renomear) | 409 | "Já existe uma categoria com esse nome." |
| Remover com despesas | 409 | "Não é possível remover uma categoria que possui despesas. Mova ou remova as despesas antes." |
| Id inexistente ou de outro dono | 404 | "Categoria não encontrada." |

## Expense (`expenses`)

Herda `EntityBase`.

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| UserId | `long` | `user_id bigint` FK → `users.id` | dono |
| CategoryId | `long` | `category_id bigint` FK → `categories.id` `ON DELETE RESTRICT` | obrigatório; categoria do mesmo dono |
| Name | `string` | `name varchar(100)` | obrigatório, sem espaços nas pontas, 1–100 |
| AmountType | `AmountType` (enum) | `amount_type smallint` | `Total = 1` ou `Installment = 2`: qual valor a família informou |
| TotalAmount | `decimal` | `total_amount numeric(12,2)` | > 0; informado (modo Total) ou calculado (`parcela × n`) |
| InstallmentAmount | `decimal` | `installment_amount numeric(12,2)` | > 0; informado (modo Installment) ou calculado (`total ÷ n`, piso em centavos) |
| InstallmentsCount | `int` | `installments_count integer` | 1–480; `1` = à vista |
| FirstDueDate | `DateOnly` | `first_due_date date` | obrigatório; pode estar no passado |
| Notes | `string?` | `notes varchar(500) null` | opcional; vazio/espaços vira `null` |
| Installments | `IList<ExpenseInstallment>` | — | 1..N parcelas |

`IsInstallment` (é parcelada?) não é coluna: `InstallmentsCount > 1`.

**Check constraints**: `total_amount > 0`, `installment_amount > 0`,
`installments_count BETWEEN 1 AND 480`, `amount_type IN (1, 2)`.

**Índices**: `ix_expenses_user_id`, `ix_expenses_category_id`.

**Validação de registro/edição (FluentValidation)**

| Regra | Mensagem (pt-BR) |
|---|---|
| Nome vazio | "O nome da despesa não pode estar vazio." |
| Nome > 100 | "O nome da despesa deve ter no máximo 100 caracteres." |
| Categoria não informada (≤ 0) | "Informe a categoria da despesa." |
| Tipo do valor inválido | "Informe se o valor é o total ou o da parcela." |
| Valor ≤ 0 | "O valor deve ser maior que zero." |
| Valor com mais de 2 casas | "O valor deve ter no máximo 2 casas decimais." |
| Valor acima de 9.999.999.999,99 (ou total calculado acima) | "O valor total da despesa é muito alto." |
| Não parcelada com quantidade ≠ 1 | "Despesa à vista deve ter exatamente 1 parcela." |
| Parcelada com quantidade < 2 ou > 480 | "Despesa parcelada deve ter de 2 a 480 parcelas." |
| Data da primeira parcela ausente | "Informe a data da primeira parcela." |
| Parcelas já pagas < 0 ou > quantidade | "As parcelas já pagas devem estar entre 0 e a quantidade de parcelas." |
| Modo Total com valor menor que R$ 0,01 por parcela | "O valor total é pequeno demais para essa quantidade de parcelas." |
| Observação > 500 | "A observação deve ter no máximo 500 caracteres." |

**Regras de negócio (use case)**

| Regra | HTTP | Mensagem |
|---|---|---|
| Categoria inexistente ou de outro dono | 400 | "A categoria informada não existe." (junto com os erros de validação) |
| Despesa inexistente ou de outro dono | 404 | "Despesa não encontrada." |
| Edição reduz quantidade abaixo das pagas | 400 | "A despesa já tem mais parcelas pagas do que a nova quantidade de parcelas." |
| Edição estrutural com parcelas amortizadas | 400 | "Desfaça os pagamentos antecipados antes de alterar valor, parcelas ou datas." |

No registro, `alreadyPaidInstallments = N` marca as N primeiras parcelas como pagas com
`paid_on = due_date` e `paid_amount = amount` (dívida já em andamento). Na edição não existe
esse campo: pagamentos são feitos pelos endpoints de parcela.

## ExpenseInstallment (`expense_installments`)

Não herda `EntityBase` (não tem `active`); tem `id` identity próprio.

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| Id | `long` | `id bigint` identity PK | interno |
| ExpenseId | `long` | `expense_id bigint` FK → `expenses.id` `ON DELETE CASCADE` | |
| Number | `int` | `number integer` | 1..N, sequencial |
| DueDate | `DateOnly` | `due_date date` | calculado (research §3) |
| Amount | `decimal` | `amount numeric(12,2)` | > 0; soma das parcelas = `TotalAmount` |
| PaidOn | `DateOnly?` | `paid_on date null` | `null` = em aberto |
| PaidAmount | `decimal?` | `paid_amount numeric(12,2) null` | `null` se em aberto; `0 < paid_amount ≤ amount` |
| Prepaid | `bool` | `prepaid boolean` | `true` quando paga por amortização |

Calculado: `IsPaid => PaidOn != null`; `Discount => IsPaid ? Amount - PaidAmount : 0`.

**Check constraints**:
`(paid_on IS NULL) = (paid_amount IS NULL)`, `paid_amount > 0 AND paid_amount <= amount`,
`NOT prepaid OR paid_on IS NOT NULL`, `number >= 1`, `amount > 0`.

**Índices**: `ux_expense_installments_expense_number` único em `(expense_id, number)`;
`ix_expense_installments_due_date`; `ix_expense_installments_paid_on`.

**Transições de estado**

```text
Em aberto ── marcar paga (data ≤ hoje) ──▶ Paga (paid_amount = amount, prepaid = false)
Em aberto ── amortizar (data ≤ hoje, valor) ──▶ Paga (paid_amount = cota, prepaid = true)
Paga ── desfazer pagamento ──▶ Em aberto (paid_on, paid_amount = null, prepaid = false)
Paga ── marcar paga de novo ──▶ Paga (sem alteração)
Em aberto ── desfazer pagamento ──▶ Em aberto (sem alteração)
```

**Validação de pagamento / amortização**

| Regra | Mensagem (pt-BR) |
|---|---|
| Data de pagamento futura | "A data do pagamento não pode ser futura." |
| Amortização sem parcelas e sem quantidade (ou com as duas) | "Informe as parcelas ou a quantidade de parcelas a amortizar." |
| Quantidade < 1 ou maior que as parcelas em aberto | "Quantidade de parcelas a amortizar inválida." |
| Parcela escolhida inexistente, repetida ou já paga | "Só é possível amortizar parcelas em aberto desta despesa." |
| Valor pago ≤ 0 ou com mais de 2 casas | "O valor pago deve ser maior que zero e ter no máximo 2 casas decimais." |
| Valor pago > soma das parcelas escolhidas | "O valor pago não pode ser maior que a soma das parcelas escolhidas." |
| Número de parcela inexistente (endpoints de pagamento) | 404 "Parcela não encontrada." |

## Valores calculados (resumo da despesa)

Calculados na Application a partir das parcelas (research §5):

| Valor | Fórmula |
|---|---|
| isInstallment | `installmentsCount > 1` |
| lastDueDate | `DueDate` da parcela N |
| paidInstallments / remainingInstallments | contagem de pagas / em aberto |
| paidAmount | Σ `PaidAmount` das pagas |
| discountAmount | Σ `Discount` |
| remainingAmount | Σ `Amount` das em aberto |
| status | `Paid` se não há em aberto, senão `Open` |
| nextDueDate | menor `DueDate` entre as em aberto (`null` se quitada) |

Invariante testada: `paidAmount + discountAmount + remainingAmount == totalAmount`.

## Migrations (FluentMigrator)

| Versão | Conteúdo |
|---|---|
| 3 | `categories` + índice único de expressão `(user_id, lower(name))` |
| 4 | `expenses` + FKs + check constraints + índices |
| 5 | `expense_installments` + FK cascade + check constraints + índices |
