# Data Model: Reembolsos de Terceiros

**Feature**: `004-third-party-reimbursements` | **Date**: 2026-11-21

Nomes em inglês, `snake_case`; dinheiro `numeric(12,2)`; datas `date`. Decisões em
[research.md](research.md) (R§n).

```text
users 1 ── * people 1 ── * person_charges          (cobranças avulsas)
                    1 ── * person_payments 1 ── * person_payment_targets
                    1 ── * expenses           (person_id opcional)
                    1 ── * recurring_entries  (person_id opcional, só contas fixas)
```

## Person (`people`)

Herda `EntityBase`.

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| UserId | `long` | `user_id bigint` FK → users | dono |
| Name | `string` | `name varchar(50)` | obrigatório, trim, 1–50; único por usuário ignorando maiúsculas |

Índice: `ux_people_user_name` em `(user_id, lower(name))`.

## Marcação em Expense e RecurringEntry — colunas novas

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| PersonId | `long?` | `person_id bigint NULL` FK → people `RESTRICT` | pessoa do mesmo usuário |
| PersonPercent | `int?` | `person_percent smallint NULL` | 1–100; padrão 100 quando há pessoa |

Checks: `(person_id IS NULL) = (person_percent IS NULL)`, `person_percent BETWEEN 1 AND 100`; em
`recurring_entries`: `person_id IS NULL OR kind = 1`.

## PersonCharge (`person_charges`) — cobrança avulsa

Herda `EntityBase`.

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| UserId | `long` | `user_id bigint` FK | dono |
| PersonId | `long` | `person_id bigint` FK → people `RESTRICT` | |
| Description | `string` | `description varchar(100)` | obrigatório, trim, 1–100 |
| Amount | `decimal` | `amount numeric(12,2)` | > 0, 2 casas, ≤ 9.999.999.999,99 |
| ChargeDate | `DateOnly` | `charge_date date` | obrigatória; define o mês |
| Notes | `string?` | `notes varchar(500) null` | opcional |

## PersonPayment (`person_payments`)

Herda `EntityBase`.

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| UserId | `long` | `user_id bigint` FK | dono |
| PersonId | `long` | `person_id bigint` FK → people `RESTRICT` | |
| Amount | `decimal` | `amount numeric(12,2)` | > 0, 2 casas, ≤ máximo |
| PaidOn | `DateOnly` | `paid_on date` | obrigatória, não futura |
| Notes | `string?` | `notes varchar(500) null` | opcional |
| Targets | `IList<PersonPaymentTarget>` | — | cobranças escolhidas (opcional) |

## PersonPaymentTarget (`person_payment_targets`)

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| Id | `long` | `id bigint` identity | |
| PersonPaymentId | `long` | FK `ON DELETE CASCADE` | |
| ChargeKey | `string` | `charge_key varchar(80)` | `Installment:{id}`, `Recurrence:{id}:{yyyy-MM}` ou `Manual:{id}` (R§4) |
| Position | `int` | `position integer` | ordem da escolha |

Único: `(person_payment_id, charge_key)`.

## Cobrança (calculada, R§3–§4)

`Charge { Key, OriginKey, OriginType (Expense|Recurrence|Manual), OriginId, Description, Number,
Count, Month, Date, Amount }` — de parcelas de despesas marcadas, ocorrências de contas fixas
marcadas e cobranças avulsas.

Resultado do abatimento (R§6): `ChargeStatus { Key, Paid, Remaining, Status (Paid|Partial|Open),
PaymentIds }`.

## Validações e mensagens novas (pt-BR)

| Regra | HTTP | Mensagem |
|---|---|---|
| Nome da pessoa vazio | 400 | "O nome da pessoa não pode estar vazio." |
| Nome da pessoa > 50 | 400 | "O nome da pessoa deve ter no máximo 50 caracteres." |
| Nome repetido | 409 | "Já existe uma pessoa com esse nome." |
| Remover pessoa com lançamentos | 409 | "Não é possível remover uma pessoa que possui cobranças, pagamentos ou despesas marcadas." |
| Pessoa inexistente / de outro dono | 404 / 400 | "Pessoa não encontrada." (rota) / "A pessoa informada não existe." (marcação) |
| Percentual fora de 1–100 | 400 | "O percentual deve estar entre 1 e 100." |
| Percentual sem pessoa | 400 | "Informe a pessoa para usar o percentual." |
| Marcar receita recorrente | 400 | "Só contas fixas (despesas) podem ser marcadas como de uma pessoa." |
| Descrição vazia / > 100 | 400 | "A descrição não pode estar vazia." / "A descrição deve ter no máximo 100 caracteres." |
| Data da cobrança ausente | 400 | "Informe a data da cobrança." |
| Data do pagamento ausente | 400 | "Informe a data do pagamento." |
| Data futura | 400 | "A data não pode ser futura." (já existe) |
| Valor | 400 | mensagens de valor existentes |
| Cobrança escolhida inválida | 400 | "Escolha apenas cobranças em aberto desta pessoa." |
| Cobrança avulsa / pagamento inexistente | 404 | "Cobrança não encontrada." / "Pagamento não encontrado." |

## Alterações em contratos existentes

- `RequestUpdateExpenseJson` / `RequestRegisterExpenseJson`: `personId?`, `personPercent?`.
- `RequestUpdateRecurrenceJson` / `RequestRecurrenceJson`: `personId?`, `personPercent?`.
- Respostas de despesa e recorrência: `person { id, name }` (ou `null`) e `personPercent`.
- `ResponseLedgerItemJson` (003): `category` passa a aceitar `null`; novo `settledAmount`; nova
  origem `Reimbursement`.

## Migrations

| Versão | Conteúdo |
|---|---|
| 10 | `people` |
| 11 | `expenses.person_id/person_percent` e `recurring_entries.person_id/person_percent` |
| 12 | `person_charges` |
| 13 | `person_payments`, `person_payment_targets` |
