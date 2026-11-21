# Quickstart: validar Receitas e Saldo Mensal

**Feature**: `003-incomes-monthly-balance`

Roteiro de validação de ponta a ponta. Contrato em [contracts/api.md](contracts/api.md); regras e
mensagens em [data-model.md](data-model.md).

## Pré-requisitos

- Tudo das features 001 e 002 configurado (Docker, `hozelo-postgres`, user-secrets) e a conta da
  família cadastrada.

## Testes e API

```powershell
dotnet test
```
```powershell
dotnet run --project src/Backend/Hozelo.Api
```

Esperado: migrations 6 a 9 aplicadas; categorias existentes com `type = 1` (despesa).

## Cenários manuais (Swagger ou `Hozelo.Api.http`)

| # | Ação | Resultado esperado | Spec |
|---|---|---|---|
| 1 | `GET /categories` | categorias da 002 com `"type": "Expense"` e `entriesCount` | US4-3 |
| 2 | `POST /categories` "Salário" Income; depois "Carro" Income (já existe "Carro" despesa) | 201, 201 | US4-1, US4-4 |
| 3 | `POST /expenses` usando a categoria "Salário" | 400 "não é de despesa" | US4-2 |
| 4 | `POST /incomes` 13º R$ 2.500 em 30/11; `POST .../receipt` | prevista → recebida | US1-1, US3-7 |
| 5 | `POST /recurrences` Income "Salário" R$ 6.000 dia 5 desde 2026-01 | 201 | US2-1 |
| 6 | `GET /summaries?year=2025&month=12` e `?year=2026&month=5` | sem salário / com salário dia 5 | US2-1, US2-2 |
| 7 | `PUT /recurrences/{id}/months/2026/12` `{ "amount": 5400 }` | só dezembro muda | US2-4 |
| 8 | `PUT /recurrences/{id}/amount` `{ "amount": 6600, "fromMonth": "2027-03" }` | fev = 6000, mar = 6600 | US2-6 |
| 9 | `POST /recurrences` Expense "Internet" R$ 120 dia 15 | aparece nas saídas dos meses | US5-1 |
| 10 | `PUT /opening-balance` R$ 3.200 em 01/11/2026; `GET /summaries` | `accumulated` preenchido | US3-9 |
| 11 | `GET /summaries` de um mês futuro | `previousBalance` = acumulado do mês anterior | US3-10, SC-008 |
| 12 | Deixar uma conta fixa de mês passado sem pagar; `GET /summaries` | aparece em `pending.toPay` | US3-15 |
| 13 | Pagar essa conta; `GET /summaries` | sai de `pending`; `endBalance` igual | US3-15 |
| 14 | `PUT /recurrences/{id}/end` `{ "endMonth": "2027-06" }`; consultar jul/2027 | sem a recorrência | US2-7 |
| 15 | `GET /installments` | igual à feature 002 | FR-018 |

Conferência: `forecast.balance = forecast.incomes − forecast.expenses`;
`realized.balance = received − paid`; `accumulated.endBalance` do mês M = `previousBalance` de
M + 1.
