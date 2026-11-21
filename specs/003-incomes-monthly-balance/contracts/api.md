# API Contract: Receitas e Saldo Mensal

**Feature**: `003-incomes-monthly-balance` | Base: `/` | JSON `camelCase` | Rotas minúsculas

Mesmas convenções da feature 002: todos os endpoints exigem `Authorization: Bearer <token>`
(401 sem token); erros `{ "errors": [...] }`; dinheiro com até 2 casas; datas `"yyyy-MM-dd"`;
**meses `"yyyy-MM"`**; enums como texto; registros de outro dono → 404.

Enums: `categoryType` / `kind` = `"Expense"` | `"Income"`.

---

## Categorias (alterações da 002)

- `GET /categories?type=Expense|Income` — `type` opcional. Cada item:
  `{ "id": 3, "name": "Salário", "type": "Income", "entriesCount": 1 }`
  (`expensesCount` foi substituído por `entriesCount`). 400 se `type` inválido.
- `POST /categories` — `{ "name": "Salário", "type": "Income" }`; `type` opcional (padrão
  `Expense`). 409 se o nome já existe **no mesmo tipo**.
- `PUT /categories/{id}` — `{ "name": "...", "type": "Income" }`; `type` opcional; diferente do
  atual → 400.
- `DELETE /categories/{id}` — 409 se houver despesas, receitas ou recorrências.
- `POST/PUT /expenses` — categoria de receita → 400 "A categoria informada não é de despesa.".

---

## Receitas avulsas

### POST `/incomes`

```json
{ "name": "13º - primeira parcela", "categoryId": 5, "amount": 2500.00,
  "expectedDate": "2026-11-30", "receivedOn": null, "notes": null }
```

201 `ResponseIncomeJson`; 400 com todas as mensagens.

```json
// ResponseIncomeJson
{ "id": 1, "name": "13º - primeira parcela", "category": { "id": 5, "name": "13º salário" },
  "amount": 2500.00, "expectedDate": "2026-11-30", "isReceived": false, "receivedOn": null,
  "notes": null }
```

### GET `/incomes?categoryId=&year=&month=`

Filtros opcionais (`year` e `month` juntos filtram pelo mês de `expectedDate`). Ordem:
`expectedDate` decrescente. 200 `{ "incomes": [ResponseIncomeJson] }`.

### GET / PUT / DELETE `/incomes/{id}`

PUT recebe o mesmo corpo do POST, **sem** `receivedOn` (recebimento tem endpoints próprios).
200 / 200 / 204; 404 "Receita não encontrada.".

### POST / DELETE `/incomes/{id}/receipt`

POST corpo opcional `{ "receivedOn": "2026-11-30" }` (padrão hoje; futuro → 400). Idempotentes.
200 `ResponseIncomeJson`.

---

## Recorrências (receitas recorrentes e contas fixas)

### POST `/recurrences`

```json
{ "kind": "Income", "name": "Salário", "categoryId": 5, "amount": 6000.00,
  "dayOfMonth": 5, "startMonth": "2026-01", "endMonth": null, "notes": null }
```

201 `ResponseRecurrenceJson`; 400.

```json
// ResponseRecurrenceJson
{
  "id": 7, "kind": "Income", "name": "Salário", "category": { "id": 5, "name": "Salário" },
  "dayOfMonth": 5, "startMonth": "2026-01", "endMonth": null, "isActive": true,
  "currentAmount": 6000.00, "notes": null,
  "amounts": [ { "fromMonth": "2026-01", "amount": 6000.00 } ],
  "months": [ { "month": "2026-12", "amount": 5400.00, "skipped": false, "settledOn": null } ]
}
```

`currentAmount` = valor da ocorrência do mês atual pela regra (sem ajuste); `isActive` = sem mês
final ou mês final ≥ mês atual. `months` lista só os meses com registro.

### GET `/recurrences?kind=&categoryId=`

200 `{ "recurrences": [ResponseRecurrenceJson sem "amounts" e "months"] }`, ordenado por nome.

### GET / PUT / DELETE `/recurrences/{id}`

PUT: `{ "name", "categoryId", "dayOfMonth", "notes" }` (vale para todos os meses).
200 / 200 / 204 (remove tudo); 404 "Recorrência não encontrada.".

### PUT `/recurrences/{id}/amount` — valor dali em diante

`{ "amount": 6600.00, "fromMonth": "2027-03" }` → 200 `ResponseRecurrenceJson`. `fromMonth` fora do
período → 400.

### PUT `/recurrences/{id}/end` — encerrar · DELETE `/recurrences/{id}/end` — reabrir

PUT `{ "endMonth": "2027-06" }` → 200; 400 se antes do início ou se houver mês confirmado depois.

### PUT `/recurrences/{id}/months/{year}/{month}` — ajustar ou pular um mês

`{ "amount": 5400.00 }` ou `{ "skipped": true }` → 200 `ResponseRecurrenceJson`.
400 fora do período, pulo de mês confirmado, ou corpo sem valor e sem pulo.

### DELETE `/recurrences/{id}/months/{year}/{month}` — desfazer ajuste/pulo

Mantém a confirmação do mês, se houver. 200 (idempotente).

### POST / DELETE `/recurrences/{id}/months/{year}/{month}/settlement` — confirmar / desfazer

POST corpo opcional `{ "settledOn": "2026-12-05" }` (padrão hoje; futuro → 400; mês fora do
período ou pulado → 400). Idempotentes. 200 `ResponseRecurrenceJson`.

---

## Saldo inicial

- `GET /opening-balance` → 200 `{ "amount": 3200.00, "referenceDate": "2026-11-01" }` ou 404
  "Saldo inicial não informado.".
- `PUT /opening-balance` `{ "amount": 3200.00, "referenceDate": "2026-11-01" }` → 200 (cria ou
  altera); `amount` pode ser negativo.

---

## Resumo do mês

### GET `/summaries?year=&month=&categoryId=`

Padrão: mês atual (informe `year` e `month` juntos). 400 mês inválido.

```json
{
  "year": 2026, "month": 11,
  "incomes": [
    { "source": "Recurrence", "sourceId": 7, "name": "Salário", "category": { "id": 5, "name": "Salário" },
      "date": "2026-11-05", "amount": 6000.00, "isSettled": true, "settledOn": "2026-11-05" },
    { "source": "Income", "sourceId": 1, "name": "13º - primeira parcela", "category": { "id": 6, "name": "13º salário" },
      "date": "2026-11-30", "amount": 2500.00, "isSettled": false, "settledOn": null }
  ],
  "expenses": [
    { "source": "Installment", "sourceId": 10, "number": 23, "installmentsCount": 48,
      "name": "Financiamento do carro", "category": { "id": 3, "name": "Carro" },
      "date": "2026-11-10", "amount": 1250.00, "isSettled": false, "settledOn": null, "paidInAdvance": false },
    { "source": "Recurrence", "sourceId": 8, "name": "Internet", "category": { "id": 4, "name": "Internet" },
      "date": "2026-11-15", "amount": 120.00, "isSettled": true, "settledOn": "2026-11-14" }
  ],
  "forecast": { "incomes": 8500.00, "expenses": 1370.00, "balance": 7130.00 },
  "realized": { "received": 6000.00, "paid": 120.00, "balance": 5880.00 },
  "pending": {
    "toReceive": 500.00, "toPay": 120.00,
    "items": [ /* mesmo formato dos itens acima, com "direction": "Income" | "Expense" */ ]
  },
  "accumulated": { "previousBalance": 3200.00, "endBalance": 10710.00 },
  "openingBalanceMissing": false
}
```

- `source`: `Installment` (parcela da 002; `sourceId` = id da despesa), `Income` (receita avulsa)
  ou `Recurrence`.
- Itens ordenados por `date`; parcelas antecipadas usam a data do pagamento (`paidInAdvance`).
- `pending` só no mês atual (senão `null`).
- `accumulated` é `null` com filtro de categoria, sem saldo inicial (`openingBalanceMissing: true`)
  ou para meses antes do saldo inicial.
- No exemplo: `endBalance = previousBalance + forecast.balance + toReceive − toPay`
  (= 3200 + 7130 + 500 − 120).

`GET /installments` (feature 002) não muda.
