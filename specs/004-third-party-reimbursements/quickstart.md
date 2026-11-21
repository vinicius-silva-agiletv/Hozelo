# Quickstart: validar Reembolsos de Terceiros

**Feature**: `004-third-party-reimbursements`

Contrato em [contracts/api.md](contracts/api.md); regras e mensagens em
[data-model.md](data-model.md).

## Pré-requisitos

Features 001–003 configuradas e a conta da família cadastrada.

```powershell
dotnet test
```
```powershell
dotnet run --project src/Backend/Hozelo.Api
```

Esperado: migrations 10 a 13 aplicadas.

## Cenários manuais

| # | Ação | Resultado esperado | Spec |
|---|---|---|---|
| 1 | `POST /people` "Sogro"; depois " sogro " | 201, 409 | US1-1, US1-2 |
| 2 | `POST /expenses` "Peças do carro" R$ 1.500 em 10x com `personId` do sogro | 201 com `person` | US2-1 |
| 3 | `GET /people/{sogro}/statement` dos meses das parcelas | cobrança de R$ 150 por mês | US2-1 |
| 4 | Despesa de R$ 400 com `personPercent: 50` para a esposa | cobrança de R$ 200 | US2-2 |
| 5 | `POST /recurrences` conta fixa "Celular" R$ 80 marcada como do sogro; ajustar um mês para R$ 95 | cobranças mensais de 80 e 95 | US2-6 |
| 6 | `POST /people/{esposa}/charges` R$ 300 | saldo da esposa +300 | US3-1 |
| 7 | `POST /people/{sogro}/payments` R$ 100 num mês com R$ 150 devidos | saldo final 50; próximo mês saldo anterior 50 | US4-1 |
| 8 | Pagamento escolhendo uma cobrança mais nova | a escolhida fica paga; a antiga continua aberta | US4-5 |
| 9 | Pagamento maior que o devido | saldo negativo (crédito) abatendo as próximas | US4-3 |
| 10 | `GET /people/{sogro}/summary` | linhas por origem; "deve até hoje" e "deve no total" batem | US4-13 |
| 11 | `GET /people` | saldo até hoje e devido no mês | US4-10 |
| 12 | `GET /summaries` do mês atual | entrada "Reembolso — Sogro"; pendência a receber com o saldo do mês anterior | US5-1, US5-3 |
| 13 | Registrar pagamento de dívida antiga no mês atual e consultar `GET /summaries` | pendência diminui, realizado aumenta, `endBalance` igual | US5-4, SC-007 |
| 14 | `DELETE /people/{sogro}` | 409 (tem lançamentos) | US1-4 |

Conferência: `endBalance(M) = previousBalance(M) + totalCharges − totalPaid` e
`previousBalance(M+1) = endBalance(M)`.
