# Research: Tela de Resumo do Mês

**Feature**: `010-frontend-monthly-summary` | **Date**: 2026-11-22

Decisões técnicas (Decision / Rationale / Alternatives). Base: 005–009 (`MonthPicker` com escolha
direta, `NativeSelect`, `PaymentToggle`, `useMonthUrl`, hooks de despesas/receitas/recorrências,
`useMonthlySummary` da 008).

## 1. Organização por feature

- **Decision**: `features/summary` (já tem `api.ts`/`hooks.ts`) ganha `components/` e
  `pages/summary-page.tsx`, ligada à rota `/` (lazy) no lugar de "em construção". As ações de
  pago/recebido reaproveitam os hooks públicos de `expenses` (`useInstallmentPayment`), `incomes`
  (`useIncomeReceipt`) e `recurrences` (`useRecurrenceAction`).
- **Alternatives considered**: endpoints próprios para quitar a partir do resumo (não existem e não
  são necessários).

## 2. Fonte dos dados

- **Decision**: uma única chamada `GET /summaries?year&month[&categoryId]` (`useMonthlySummary`) traz
  itens de entrada e saída, previsto, realizado, pendências (só mês atual, com saldo inicial, sem
  filtro), acumulado e `openingBalanceMissing`. Nenhum total é calculado na tela (SC-003).
- **Identificação dos itens** (conferido no backend, `GetMonthlySummaryUseCase`): `source` +
  `sourceId` — `Installment` → id da despesa (+ `number` da parcela); `Income` → id da receita
  avulsa; `Recurrence` → id da recorrência (+ `month` da ocorrência); `Reimbursement` → id da pessoa.

## 3. Destaque principal (clarify Q1)

- **Decision**: cartão "Saldo no fim do mês" com `accumulated.endBalance`, "veio de {mês anterior}"
  (`previousBalance`) e o saldo do mês; legenda "projeção de fechamento" quando o mês ≥ mês atual e
  "fechamento realizado" quando o mês < mês atual. Sem `accumulated`, o cartão mostra "Saldo previsto
  do mês" (`forecast.balance`) com o motivo:
  - `openingBalanceMissing` → aviso + link para `/configuracoes`;
  - filtro de categoria → "o saldo acumulado vale só sem filtro";
  - caso contrário (mês antes do saldo inicial) → "o acompanhamento começa no mês do saldo inicial".
- Valores negativos com cor de alerta.

## 4. Caixa de pago/recebido (clarify Q2, FR-006, FR-007)

- **Decision**: `LedgerToggle` escolhe a ação pelo `source` e usa o `PaymentToggle` compartilhado:
  - `Installment`: `useInstallmentPayment().mutateAsync({ expenseId: sourceId, number, paid })`;
  - `Income`: `useIncomeReceipt(sourceId).mutateAsync({ received })`;
  - `Recurrence`: `useRecurrenceAction(sourceId).mutateAsync({ type: 'settle' | 'undoSettlement', month })`;
  - `Reimbursement`: sem caixa (só leitura; o nome leva à pessoa).
  Todos esses hooks já invalidam `['summary']`, então totais, pendências e acumulado voltam da API.
  Textos por direção: entradas "Recebida"/"A receber"; saídas "Paga"/"Em aberto".

## 5. Pendências

- **Decision**: seção mostrada só quando `pending` vem preenchido e tem itens; totais a pagar e a
  receber da API e a lista (`pending.items`) com o mês de origem por extenso, a mesma `LedgerToggle`
  e o link de detalhe.

## 6. Listas de entradas e saídas

- **Decision**: `Tabs` Entradas | Saídas (aba no endereço: `lista=saidas`), itens em ordem de data
  (como vêm da API), com data, nome, categoria ou "reembolso", n/total, valor (o pago quando quitado;
  "R$ X / de R$ Y" quando parcial, como na 008), marca "antecipada" e a caixa.
- **Links** (FR-008): `Installment` → `/despesas?despesa={id}`, `Income` → `/receitas?receita={id}`,
  `Recurrence` de entrada → `/receitas?recorrencia={id}`, `Recurrence` de saída →
  `/contas-fixas?recorrencia={id}`, `Reimbursement` → `/pessoas/{id}?mes={month}`.

## 7. Filtro de categoria

- **Decision**: `NativeSelect` com dois grupos (`<optgroup>` Despesas e Receitas) usando
  `useCategories('Expense')` e `useCategories('Income')`; categoria desconhecida no endereço → todas.

## 8. Estado no endereço

- **Decision**: `useMonthUrl` (`mes`, `categoria`) + `lista` (`entradas` padrão | `saidas`) com
  `replace`.

## 9. Testes

- **Decision**: `test/summary-store.ts` — itens do resumo em memória por mês (com totais, pendências e
  acumulado configuráveis) e os endpoints de quitar/desfazer de parcela, receita e recorrência, que
  mudam o item e recalculam realizado/pendências de forma simples. Os testes conferem que a tela
  mostra o que a API devolve e chama a operação certa para cada tipo.

## 10. Dependências

- **Decision**: nenhuma dependência npm nova.
