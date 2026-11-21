# Quickstart: validar Despesas e Categorias

**Feature**: `002-expenses-categories`

Roteiro para provar, de ponta a ponta, que a feature funciona. Contrato em
[contracts/api.md](contracts/api.md); regras e mensagens em [data-model.md](data-model.md).

## Pré-requisitos

- Tudo da feature 001 já configurado (Docker, container `hozelo-postgres`, user-secrets) e a
  conta da família cadastrada.
- Opcional: `Settings:Calendar:TimeZoneId` (padrão `America/Sao_Paulo`).

## Rodar os testes

Na pasta `backend`:

```powershell
dotnet test
```

Esperado: todos os testes passam, incluindo o novo `Domain.Tests` (cálculo de parcelas e
amortização).

## Rodar a API

```powershell
dotnet run --project src/Backend/Hozelo.Api
```

Esperado: as migrations 3 a 5 criam `categories`, `expenses` e `expense_installments`. Faça
login no Swagger e use **Authorize** com o token.

## Cenários manuais (Swagger ou `Hozelo.Api.http`)

| # | Ação | Resultado esperado | Spec |
|---|---|---|---|
| 1 | `GET /expenses` sem token | 401 | FR-015 |
| 2 | `POST /categories` "Carro" e "Água"; depois "  carro " | 201, 201, 409 | US1-1, US1-2 |
| 3 | `POST /expenses` "Conta de água", Total 120,00, à vista, 10/12/2026 | 1 parcela, restante 120,00 | US2-1 |
| 4 | `POST /expenses` Total 100,00 em 3x | parcelas 33,33 / 33,33 / 33,34 | US2-4 |
| 5 | `POST /expenses` parcela 1.250,00 × 48, primeira 10/01/2025, 22 já pagas | total 60.000,00; 22 pagas; restante 32.500,00 | US2-3, US2-5 |
| 6 | `POST /expenses` primeira parcela em 31/01/2027, 3x | vencimentos 31/01, 28/02, 31/03 | Edge case |
| 7 | `POST .../installments/23/payment` e depois `DELETE` | pagas 23 → 22; totais voltam | US3-4, US3-5 |
| 8 | `GET /installments` (sem parâmetros) e `?year=2027&month=1` | parcelas do mês atual e de jan/2027 com totais | US3-7, US3-8 |
| 9 | `POST /expenses/{id}/amortizations` `quantity: 6`, `paidAmount: 6000` | parcelas 43–48 pagas, desconto 1.500,00 | US4-1, US4-2 |
| 10 | `GET /installments` do mês atual | amortização aparece com `paidInAdvance: true`; dez/2028 não mostra a 48 como a pagar | US4-4 |
| 11 | `PUT /expenses/{id}` mudando a quantidade | 400 "Desfaça os pagamentos antecipados..." | FR-013 |
| 12 | `GET /expenses?status=Open&categoryId=...` | só despesas em aberto da categoria; totais batem | US3-2 |
| 13 | `DELETE /categories/{carro}` | 409 (tem despesas) | US1-5 |
| 14 | `DELETE /expenses/{id}` e depois `GET /expenses/{id}` | 204, 404 | US5-4, US5-5 |

Conferência da invariante em qualquer despesa: `paidAmount + discountAmount + remainingAmount
= totalAmount` (SC-002).
