# API Contract: Reembolsos de Terceiros

**Feature**: `004-third-party-reimbursements` | Base: `/` | JSON `camelCase` | Rotas minúsculas

Convenções das features anteriores: Bearer obrigatório (401); erros `{ "errors": [...] }`;
dinheiro 2 casas; datas `"yyyy-MM-dd"`; meses `"yyyy-MM"`; enums em texto; registros de outro dono
→ 404.

---

## Pessoas

### GET `/people`

```json
{ "people": [ { "id": 2, "name": "Sogro", "balanceUntilNow": 80.00, "currentMonthDue": 230.00 } ] }
```

`balanceUntilNow` = cobranças até o mês atual − pagamentos até hoje; `currentMonthDue` = saldo
anterior + cobranças do mês atual − pagamentos do mês atual. Ordem alfabética.

### POST `/people` · PUT `/people/{id}` · DELETE `/people/{id}`

Corpo `{ "name": "Sogro" }`. 201 / 204 / 204; 400; 404 "Pessoa não encontrada."; 409 nome
repetido ou pessoa com lançamentos.

---

## Marcação em despesas e contas fixas (alteração)

`POST/PUT /expenses` e `POST/PUT /recurrences` aceitam:

```json
{ "...": "...", "personId": 2, "personPercent": 100 }
```

`personPercent` padrão 100 quando há `personId`; `personId: null` desmarca. Respostas trazem
`"person": { "id": 2, "name": "Sogro" }` e `"personPercent": 100` (ou `null`).

---

## Cobranças avulsas

- `POST /people/{id}/charges` — `{ "description": "Empréstimo em dinheiro", "amount": 300.00,
  "chargeDate": "2026-12-10", "notes": null }` → 201
  `{ "id": 7, "key": "Manual:7", "description": "...", "amount": 300.00, "chargeDate": "2026-12-10", "notes": null }`.
- `PUT /people/{id}/charges/{chargeId}` (mesmo corpo) → 200; `DELETE` → 204; 404 "Cobrança não
  encontrada.".

---

## Pagamentos

- `POST /people/{id}/payments`

```json
{ "amount": 150.00, "paidOn": "2026-12-12", "notes": "Pix", "chargeKeys": ["Installment:381"] }
```

`chargeKeys` opcional (cobranças escolhidas). 201
`{ "id": 4, "amount": 150.00, "paidOn": "2026-12-12", "notes": "Pix", "chargeKeys": ["Installment:381"] }`.
400 data futura, valor inválido ou "Escolha apenas cobranças em aberto desta pessoa.".

- `PUT /people/{id}/payments/{paymentId}` (mesmo corpo) → 200; `DELETE` → 204; 404 "Pagamento não
  encontrado.".

---

## Extrato do mês

### GET `/people/{id}/statement?year=&month=`

Padrão: mês atual.

```json
{
  "person": { "id": 2, "name": "Sogro" },
  "year": 2026, "month": 12,
  "previousBalance": 300.00,
  "charges": [
    { "key": "Installment:381", "originType": "Expense", "originId": 10,
      "description": "Peças do carro", "number": 4, "count": 10,
      "date": "2027-01-05", "amount": 150.00,
      "paid": 150.00, "remaining": 0.00, "status": "Paid" }
  ],
  "totalCharges": 350.00,
  "totalDue": 650.00,
  "payments": [ { "id": 4, "amount": 500.00, "paidOn": "2026-12-12", "notes": null, "chargeKeys": [] } ],
  "totalPaid": 500.00,
  "endBalance": 150.00
}
```

`status` = `Paid` | `Partial` | `Open`. `endBalance` negativo = crédito.

---

## Resumo geral da pessoa

### GET `/people/{id}/summary`

```json
{
  "person": { "id": 2, "name": "Sogro" },
  "origins": [
    { "originType": "Expense", "originId": 10, "description": "Peças do carro",
      "chargesDue": 3, "chargesTotal": 10, "monthlyAmount": null,
      "total": 1500.00, "paid": 450.00, "remaining": 1050.00, "isOpenEnded": false },
    { "originType": "Recurrence", "originId": 8, "description": "Celular",
      "chargesDue": 3, "chargesTotal": 3, "monthlyAmount": 80.00,
      "total": 240.00, "paid": 160.00, "remaining": 80.00, "isOpenEnded": true }
  ],
  "owedUntilNow": 80.00,
  "owedTotal": 1730.00,
  "unallocatedCredit": 0.00
}
```

`isOpenEnded`: conta fixa sem mês final (só meses até o atual entram nos totais).

---

## Resumo do mês da família (alteração da 003)

`GET /summaries` sem filtro de categoria inclui, em `incomes`, um item por pessoa com movimento no
mês:

```json
{ "source": "Reimbursement", "sourceId": 2, "direction": "Income", "name": "Reembolso — Sogro",
  "category": null, "month": "2026-12", "date": "2026-12-01",
  "amount": 350.00, "settledAmount": 500.00, "isSettled": true, "settledOn": null, "paidInAdvance": false }
```

- `forecast.incomes` soma `amount` (cobranças do mês); `realized.received` soma `settledAmount`
  (pagamentos do mês).
- `pending.items` (mês atual) inclui um item `Reimbursement` por pessoa com saldo ≠ 0 ao fim do
  mês anterior; `pending.toReceive` soma esses saldos (crédito subtrai).
- Com `categoryId`, reembolsos não aparecem.
