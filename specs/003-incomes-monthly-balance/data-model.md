# Data Model: Receitas e Saldo Mensal

**Feature**: `003-incomes-monthly-balance` | **Date**: 2026-11-21

Nomes em inglês, `snake_case`; dinheiro `numeric(12,2)`; datas de calendário `date`; meses
gravados como `date` no dia 1. Decisões em [research.md](research.md) (R§n).

```text
users 1 ── * categories 1 ── * incomes
                         1 ── * recurring_entries 1 ── * recurring_entry_amounts
                                                  1 ── * recurring_entry_months
users 1 ── 0..1 opening_balances
```

## Category (`categories`) — alterada

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| Type | `CategoryType` | `type smallint NOT NULL DEFAULT 1` | `Expense = 1`, `Income = 2`; imutável após criada |

- Índice `ux_categories_user_name` substituído por `ux_categories_user_type_name` em
  `(user_id, type, lower(name))`; check `type IN (1, 2)`.
- Regras novas: nome único **por tipo**; POST sem `type` = `Expense`; PUT com `type` diferente →
  400 "O tipo da categoria não pode ser alterado."; contagem `entriesCount` = despesas + receitas +
  recorrências da categoria; remoção recusada (409) se `entriesCount > 0`, com a mensagem atual
  ajustada para "Não é possível remover uma categoria que possui lançamentos. Mova ou remova os
  lançamentos antes."
- Despesa (feature 002) com categoria de receita → 400 "A categoria informada não é de despesa.";
  receita (avulsa ou recorrente de receita) com categoria de despesa → 400 "A categoria informada
  não é de receita."; recorrência de despesa com categoria de receita → 400 "A categoria informada
  não é de despesa.".

## Income (`incomes`) — receita avulsa

Herda `EntityBase`.

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| UserId | `long` | `user_id bigint` FK → users | dono |
| CategoryId | `long` | `category_id bigint` FK → categories `RESTRICT` | categoria de receita do dono |
| Name | `string` | `name varchar(100)` | obrigatório, trim, 1–100 |
| Amount | `decimal` | `amount numeric(12,2)` | > 0, 2 casas, ≤ 9.999.999.999,99 |
| ExpectedDate | `DateOnly` | `expected_date date` | obrigatório; define o mês de referência |
| ReceivedOn | `DateOnly?` | `received_on date null` | `null` = prevista; não futura |
| Notes | `string?` | `notes varchar(500) null` | opcional; vazio vira `null` |

Checks: `amount > 0`. Índices: `ix_incomes_user_id`, `ix_incomes_category_id`,
`ix_incomes_expected_date`.

## RecurringEntry (`recurring_entries`) — receita recorrente ou conta fixa

Herda `EntityBase`.

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| UserId | `long` | `user_id bigint` FK → users | dono |
| CategoryId | `long` | `category_id bigint` FK → categories `RESTRICT` | tipo da categoria = `Kind` |
| Kind | `EntryKind` | `kind smallint` | `Expense = 1`, `Income = 2`; imutável |
| Name | `string` | `name varchar(100)` | obrigatório, trim, 1–100 |
| DayOfMonth | `int` | `day_of_month integer` | 1–31 |
| StartMonth | `DateOnly` | `start_month date` | dia 1 |
| EndMonth | `DateOnly?` | `end_month date null` | dia 1; `≥ StartMonth`; `null` = sem fim |
| Notes | `string?` | `notes varchar(500) null` | opcional |
| Amounts | `IList<RecurringEntryAmount>` | — | ≥ 1 (a primeira em `StartMonth`) |
| Months | `IList<RecurringEntryMonth>` | — | registros por mês |

Checks: `kind IN (1, 2)`, `day_of_month BETWEEN 1 AND 31`, `extract(day from start_month) = 1`,
`end_month IS NULL OR (end_month >= start_month AND extract(day from end_month) = 1)`.

## RecurringEntryAmount (`recurring_entry_amounts`) — histórico de valores

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| Id | `long` | `id bigint` identity | |
| RecurringEntryId | `long` | FK `ON DELETE CASCADE` | |
| EffectiveMonth | `DateOnly` | `effective_month date` | dia 1; único por recorrência |
| Amount | `decimal` | `amount numeric(12,2)` | > 0, 2 casas |

Único: `(recurring_entry_id, effective_month)`.

## RecurringEntryMonth (`recurring_entry_months`) — registro de um mês

Criado só quando o mês tem ajuste, pulo ou liquidação; apagado quando fica vazio.

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| Id | `long` | `id bigint` identity | |
| RecurringEntryId | `long` | FK `ON DELETE CASCADE` | |
| Month | `DateOnly` | `month date` | dia 1; único por recorrência |
| Amount | `decimal?` | `amount numeric(12,2) null` | valor ajustado (> 0); `null` = segue a regra |
| Skipped | `bool` | `skipped boolean` | pulo do mês |
| SettledOn | `DateOnly?` | `settled_on date null` | recebida (receita) / paga (conta fixa); não futura |

Checks: `amount IS NULL OR amount > 0`, `NOT (skipped AND settled_on IS NOT NULL)`.
Único: `(recurring_entry_id, month)`.

## Ocorrência (calculada, R§4)

`Occurrence { RecurringEntryId, Kind, Name, Category, Month, Date, Amount, IsSettled, SettledOn,
IsAdjusted }` — não é gravada.

## OpeningBalance (`opening_balances`)

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| Id | `long` | `id bigint` identity | |
| UserId | `long` | `user_id bigint` FK, **único** | um por conta |
| Amount | `decimal` | `amount numeric(12,2)` | pode ser negativo ou zero; 2 casas; \|valor\| ≤ 9.999.999.999,99 |
| ReferenceDate | `DateOnly` | `reference_date date` | obrigatória |
| UpdatedOn | `DateTime` | `updated_on timestamptz` | UTC |

## Validações e mensagens novas (pt-BR)

| Regra | HTTP | Mensagem |
|---|---|---|
| Nome vazio (receita/recorrência) | 400 | "O nome não pode estar vazio." (reaproveita `NAME_EMPTY` da 001) |
| Nome > 100 | 400 | "O nome deve ter no máximo 100 caracteres." (`NAME_TOO_LONG`) |
| Categoria não informada | 400 | "Informe a categoria." |
| Categoria inexistente | 400 | "A categoria informada não existe." (já existe) |
| Categoria do tipo errado | 400 | "A categoria informada não é de receita." / "...não é de despesa." |
| Valor ≤ 0 / > 2 casas / muito alto | 400 | mensagens de valor da 002 |
| Data prevista ausente | 400 | "Informe a data prevista de recebimento." |
| Data de recebimento/pagamento futura | 400 | "A data do pagamento não pode ser futura." → generalizada para "A data não pode ser futura." (nova chave `DATE_IN_FUTURE`) |
| Tipo de recorrência inválido | 400 | "Informe se a recorrência é de receita ou de despesa." |
| Dia fora de 1–31 | 400 | "O dia deve estar entre 1 e 31." |
| Mês em formato inválido | 400 | "Informe o mês no formato AAAA-MM." |
| Mês final antes do inicial | 400 | "O mês final não pode ser anterior ao mês inicial." |
| Ajuste fora do período | 400 | "O mês informado está fora do período da recorrência." |
| Pular mês liquidado | 400 | "Desfaça a confirmação do mês antes de pulá-lo." |
| Confirmar mês pulado | 400 | "Este mês foi pulado; desfaça o pulo antes de confirmar." |
| Encerrar antes de mês liquidado | 400 | "Existem meses confirmados depois do mês final informado." |
| Ajuste sem valor e sem pulo | 400 | "Informe o novo valor do mês ou marque o mês como pulado." |
| Tipo de categoria alterado | 400 | "O tipo da categoria não pode ser alterado." |
| Tipo de categoria inválido | 400 | "Tipo de categoria inválido. Use Expense ou Income." |
| Saldo inicial sem data | 400 | "Informe a data de referência do saldo inicial." |
| Receita / recorrência inexistente | 404 | "Receita não encontrada." / "Recorrência não encontrada." |

## Migrations

| Versão | Conteúdo |
|---|---|
| 6 | `categories.type` + troca do índice único |
| 7 | `incomes` |
| 8 | `recurring_entries`, `recurring_entry_amounts`, `recurring_entry_months` |
| 9 | `opening_balances` |
