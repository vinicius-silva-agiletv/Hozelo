# API Contract: Despesas e Categorias

**Feature**: `002-expenses-categories` | Base: `/` | JSON em `camelCase` | Rotas em minúsculas

- **Todos** os endpoints exigem `Authorization: Bearer <token>` (`[AuthenticatedUser]`); sem
  token ou com token inválido: 401, como na feature 001.
- Erros: `{ "errors": ["mensagem em português", "..."] }`.
- Dinheiro: número JSON com até 2 casas (`1250.00`). Datas: `"yyyy-MM-dd"`.
- Enums como texto: `amountType` = `"Total"` | `"Installment"`; `status` = `"Open"` | `"Paid"`.
- Registros de outro dono respondem 404 como se não existissem.
- Contratos C# em `Hozelo.Communication` (`Requests/`, `Responses/`).

---

## Categorias

### GET `/categories`: listar

200 `ResponseCategoriesJson`, em ordem alfabética:

```json
{ "categories": [ { "id": 3, "name": "Carro", "expensesCount": 2 } ] }
```

### POST `/categories`: criar

```json
// RequestCategoryJson
{ "name": "Cartão Nubank" }
```

| Status | Corpo | Quando |
|---|---|---|
| 201 Created | `ResponseCategoryJson` `{ "id": 4, "name": "Cartão Nubank", "expensesCount": 0 }` | criada |
| 400 | mensagens de validação | nome vazio/longo |
| 409 | `["Já existe uma categoria com esse nome."]` | nome repetido |

### PUT `/categories/{id}`: renomear

Body `RequestCategoryJson`. 204 No Content; 400; 404 `["Categoria não encontrada."]`; 409 nome
repetido (renomear para o próprio nome atual, mudando só maiúsculas, é permitido).

### DELETE `/categories/{id}`: remover

204 No Content; 404; 409 `["Não é possível remover uma categoria que possui despesas. Mova ou
remova as despesas antes."]`.

---

## Despesas

### POST `/expenses`: registrar

```json
// RequestRegisterExpenseJson
{
  "name": "Financiamento do carro",
  "categoryId": 3,
  "amountType": "Installment",
  "amount": 1250.00,
  "isInstallment": true,
  "installmentsCount": 48,
  "firstDueDate": "2025-01-10",
  "alreadyPaidInstallments": 22,
  "notes": "Banco X"
}
```

| Status | Corpo | Quando |
|---|---|---|
| 201 Created | `ResponseExpenseJson` (detalhe, abaixo) | registrada |
| 400 | **todas** as mensagens de validação, incluindo "A categoria informada não existe." | dados inválidos |

### PUT `/expenses/{id}`: editar

Body `RequestUpdateExpenseJson`: igual ao registro, **sem** `alreadyPaidInstallments`.
200 `ResponseExpenseJson`; 400 (validação e regras de recálculo, ver data-model); 404.

### DELETE `/expenses/{id}`: remover

204 No Content; 404.

### GET `/expenses/{id}`: detalhe com parcelas

200 `ResponseExpenseJson`; 404 `["Despesa não encontrada."]`.

```json
// ResponseExpenseJson
{
  "id": 10,
  "name": "Financiamento do carro",
  "category": { "id": 3, "name": "Carro" },
  "amountType": "Installment",
  "totalAmount": 60000.00,
  "installmentAmount": 1250.00,
  "isInstallment": true,
  "installmentsCount": 48,
  "paidInstallments": 22,
  "remainingInstallments": 26,
  "firstDueDate": "2025-01-10",
  "lastDueDate": "2028-12-10",
  "nextDueDate": "2026-11-10",
  "paidAmount": 27500.00,
  "discountAmount": 0.00,
  "remainingAmount": 32500.00,
  "status": "Open",
  "notes": "Banco X",
  "installments": [
    { "number": 1, "dueDate": "2025-01-10", "amount": 1250.00,
      "isPaid": true, "paidOn": "2025-01-10", "paidAmount": 1250.00, "prepaid": false }
  ]
}
```

### GET `/expenses`: listar com totais

Query opcional: `categoryId` (long), `status` (`Open` | `Paid`).
Ordem: próximo vencimento em aberto crescente; quitadas por último.

200 `ResponseExpensesJson`:

```json
{
  "totalPaidAmount": 27500.00,
  "totalRemainingAmount": 32500.00,
  "totalDiscountAmount": 0.00,
  "expenses": [ /* ResponseExpenseJson sem "installments" (ResponseShortExpenseJson) */ ]
}
```

400 se `status` inválido.

---

## Parcelas e pagamentos

### POST `/expenses/{id}/installments/{number}/payment`: marcar como paga

```json
// RequestPayInstallmentJson (corpo opcional)
{ "paidOn": "2026-11-21" }   // padrão: hoje (fuso configurado)
```

200 `ResponseExpenseJson` atualizado (idempotente: parcela já paga não muda); 400 data futura;
404 despesa ou parcela inexistente.

### DELETE `/expenses/{id}/installments/{number}/payment`: desfazer pagamento

200 `ResponseExpenseJson` atualizado (idempotente); 404. Serve também para desfazer amortização.

### POST `/expenses/{id}/amortizations`: amortizar

```json
// RequestAmortizeExpenseJson — informe "installmentNumbers" OU "quantity"
{ "installmentNumbers": [43, 44, 45, 46, 47, 48], "quantity": null,
  "paidOn": "2026-11-21", "paidAmount": 6000.00 }
```

`quantity` sozinho escolhe as últimas parcelas em aberto. `paidOn` padrão: hoje.

200 `ResponseExpenseJson` atualizado; 400 com as mensagens de amortização (data-model); 404.

---

## Visão mensal

### GET `/installments`: parcelas do mês

Query: `year`, `month` (ambos opcionais; padrão o mês atual — se informar um, informe os dois),
`categoryId` (opcional). 400 se mês fora de 1–12 ou ano fora de 2000–2100.

200 `ResponseMonthlyInstallmentsJson`, ordenado por data de referência (vencimento ou, para
antecipadas, data do pagamento):

```json
{
  "year": 2026,
  "month": 11,
  "totalAmount": 2250.00,
  "paidAmount": 1000.00,
  "openAmount": 1250.00,
  "installments": [
    {
      "expenseId": 10, "expenseName": "Financiamento do carro",
      "category": { "id": 3, "name": "Carro" },
      "number": 23, "installmentsCount": 48,
      "dueDate": "2026-11-10", "amount": 1250.00,
      "isPaid": false, "paidOn": null, "paidAmount": null,
      "prepaid": false, "paidInAdvance": false
    },
    {
      "expenseId": 10, "expenseName": "Financiamento do carro",
      "category": { "id": 3, "name": "Carro" },
      "number": 48, "installmentsCount": 48,
      "dueDate": "2028-12-10", "amount": 1250.00,
      "isPaid": true, "paidOn": "2026-11-21", "paidAmount": 1000.00,
      "prepaid": true, "paidInAdvance": true
    }
  ]
}
```

`paidInAdvance` = paga em mês anterior ao do vencimento (aparece aqui, não no mês de
vencimento). `totalAmount` soma `paidAmount` das pagas + `amount` das em aberto.
Marcar/desmarcar a partir da visão usa os endpoints de pagamento com `expenseId` e `number`.
