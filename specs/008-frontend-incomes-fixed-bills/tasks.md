---

description: "Task list for feature 008-frontend-incomes-fixed-bills (Telas de Receitas e Contas Fixas)"
---

# Tasks: Telas de Receitas e Contas Fixas

**Input**: Design documents from `/specs/008-frontend-incomes-fixed-bills/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md

**Tests**: obrigatórios pela constitution v1.2.0 (Princípio II): Vitest + Testing Library. Testes
antes da implementação em cada história.

**Organization**: tarefas por história de usuário (US1..US7). A fundação inclui mover para
`components/shared` o que a 007 criou e agora serve às três telas, sem mudar o comportamento da
tela de Despesas (os testes da 007 continuam passando).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história de usuário (US1..US7)

## Path Conventions

- `FE/` = `frontend/src/`

API consumida, avisos, textos e componentes: [contracts/ui.md](contracts/ui.md). Tipos,
validações, derivações e endereço: [data-model.md](data-model.md). Decisões:
[research.md](research.md) (R§n).

---

## Phase 1: Setup

- [ ] T001 Conferir na branch `008-frontend-incomes-fixed-bills` que `npm --prefix frontend test` (134), `lint` e `build` passam; anotar o JS inicial (referência 337 kB)

---

## Phase 2: Foundational

- [ ] T002 [P] Adicionar a `FE/types/api.ts` os tipos de data-model.md "Tipos" (`EntryKind`, `LedgerSource`, receitas, recorrências, item do resumo e resumo mensal)
- [ ] T003 [P] Adicionar a `FE/lib/query-keys.ts` as chaves de data-model.md "Chaves de cache" (`summary`, `incomes`, `income`, `recurrences`, `recurrence`) e fazer as mutações de despesa (007) invalidarem também `['summary']`
- [ ] T004 Mover para `FE/components/shared/`: `option-group.tsx` (de `features/expenses`), `payment-toggle.tsx` generalizado (`isPaid`, `label`, `onToggle(paid) => Promise`, mensagens de sucesso por prop; mantém trava e confirmação opcional) e `person-split-fields.tsx` (seção "Dividir com uma pessoa" extraída de `expense-form-dialog.tsx`); ajustar a tela de Despesas para usá-los sem mudar comportamento (R§1, R§5)
- [ ] T005 Generalizar o estado no endereço em `FE/lib/use-month-url.ts` (mês, categoria, item aberto com `push`/fechar com "voltar") e fazer `FE/features/expenses/use-expenses-url.ts` usá-lo; testes em `FE/lib/use-month-url.test.tsx` (R§3)
- [ ] T006 [P] Criar `FE/features/summary/api.ts` + `hooks.ts` (`useMonthlySummary(month, categoryId)`)
- [ ] T007 [P] Criar `FE/features/recurrences/occurrence.ts` com as derivações de data-model.md "Derivações da tela" e testes em `FE/features/recurrences/occurrence.test.ts` (ativa no mês, valor normal pelo histórico, ajustado, pulada, quitada, totais de contas fixas)
- [ ] T008 Criar `FE/features/recurrences/api.ts` e `FE/features/incomes/api.ts` com as chamadas de contracts/ui.md "API consumida"
- [ ] T009 Criar `FE/test/finance-store.ts` (R§9): avulsas e recorrências em memória respondendo `/incomes`, `/recurrences` (meses, valores, fim, pessoa) e `/summaries` (itens e totais do mês, puladas fora, reembolsos semeados como itens prontos) para `mockApi`, e `FE/test/finance-setup.ts` (sessão, categorias de receita e despesa, pessoas)
- [ ] T010 Criar as páginas `FE/features/incomes/pages/incomes-page.tsx` e `FE/features/fixed-bills/pages/fixed-bills-page.tsx` (título, `PageHeader` com o botão de cadastro, `MonthPicker`) e ligar `/receitas` e `/contas-fixas` (lazy) em `FE/app/router.tsx`

**Checkpoint**: as duas rotas abrem; Despesas continua igual (testes da 007 verdes); derivações e store testados.

---

## Phase 3: User Story 1 - Ver as receitas do mês (Priority: P1) 🎯 MVP

**Goal**: avulsas, ocorrências e reembolsos do mês com previsto, recebido e a receber.

**Independent Test**: US1-1..6 e clarify Q1 com o `financeStore`.

- [ ] T011 [P] [US1] Testes em `FE/features/incomes/components/income-month-list.test.tsx`: itens em ordem de data com nome, categoria, valor, situação e marca "recorrente"; totais iguais aos da API; troca de mês e filtro no endereço; recorrente pulada fora; reembolso só leitura com marca e nome, entrando nos totais e levando a `/pessoas`; estado vazio com "Nova receita"; erro com "Tentar novamente"
- [ ] T012 [US1] Criar `FE/features/incomes/components/income-month-list.tsx` (totais, lista, filtro de categoria de receita, estados) e usá-la em `FE/features/incomes/pages/incomes-page.tsx`

---

## Phase 4: User Story 2 - Marcar receita como recebida ou desfazer (Priority: P1)

**Goal**: receber/desfazer avulsa e ocorrência, em outra data ou com outro valor.

**Independent Test**: US2-1..5 com o `financeStore`.

- [ ] T013 [P] [US2] Testes em `FE/features/incomes/components/income-receipt.test.tsx`: receber avulsa (`POST …/receipt`) e ocorrência (`POST …/settlement` só do mês), desfazer, "Receber em outra data" recusando data futura, "Receber com outro valor" (ajusta e quita), toque duplo envia uma vez, erro da API desfaz a caixa
- [ ] T014 [US2] Adicionar a `FE/features/incomes/hooks.ts` e `FE/features/recurrences/hooks.ts` os hooks de receber/quitar, desfazer e quitar com outro valor (R§4, R§5); criar `FE/features/recurrences/components/settle-dialogs.tsx` (data-model.md `SettleOnDateForm.settledOn`, `SettleWithAmountForm.amount`, `SettleWithAmountForm.settledOn`) e `occurrence-menu.tsx` (itens de receber); ligar a caixa e o menu nas linhas de `income-month-list.tsx`

---

## Phase 5: User Story 3 - Cadastrar receitas avulsas e recorrentes (Priority: P1)

**Goal**: "Nova receita" em dois modos, com os padrões de FR-017.

**Independent Test**: US3-1..6 com o `financeStore`.

- [ ] T015 [P] [US3] Testes em `FE/features/incomes/schemas.test.ts` e `FE/features/recurrences/schemas.test.ts` para data-model.md `IncomeForm.name`, `IncomeForm.categoryId`, `IncomeForm.amount`, `IncomeForm.expectedDate`, `IncomeForm.receivedOn`, `IncomeForm.notes` e `RecurrenceForm.name`, `RecurrenceForm.categoryId`, `RecurrenceForm.amount`, `RecurrenceForm.dayOfMonth`, `RecurrenceForm.startMonth`, `RecurrenceForm.endMonth`, `RecurrenceForm.notes`
- [ ] T016 [P] [US3] Testes em `FE/features/incomes/components/income-form-dialog.test.tsx`: avulsa aparece no mês com "Receita cadastrada."; "Já recebida" envia `receivedOn`; "Todo mês" cria a recorrente (início no mês aberto, dia de hoje, sem fim) e aparece nos meses seguintes; fim respeitado; validações; recusa da API; sem categorias de receita → aviso com link
- [ ] T017 [P] [US3] Criar `FE/features/incomes/schemas.ts` e `FE/features/recurrences/schemas.ts` (campos citados em T015; pessoa fica para a US7)
- [ ] T018 [US3] Criar `FE/features/recurrences/components/recurrence-form-dialog.tsx` (cadastro e edição; `kind`; padrões FR-017; R§7) e `FE/features/incomes/components/income-form-dialog.tsx` (modo Avulsa | Todo mês, este reaproveitando os campos da recorrência), com os hooks de cadastro; abrir pelo botão da página e pelo estado vazio

**Checkpoint**: Receitas completa no dia a dia (ver, receber, cadastrar) — **MVP**.

---

## Phase 6: User Story 4 - Ver, cadastrar e pagar contas fixas (Priority: P1)

**Goal**: contas do mês com valor, dia, situação e totais; cadastro; pagar; seção Encerradas.

**Independent Test**: US4-1..6 com o `financeStore`.

- [ ] T019 [P] [US4] Testes em `FE/features/fixed-bills/components/fixed-bill-month-list.test.tsx`: contas ativas no mês por dia com valor, categoria, "dia N" e situação; totais Previsto/Pago/A pagar; pagar/desfazer só o mês; "Pagar em outra data"; "Pagar com outro valor" (R$ 310,00, mês ajustado e pago, mês seguinte normal); conta futura fora do mês; encerrada fora do mês e em "Encerradas"; estado vazio com "Nova conta fixa"; cadastro "Escola" com início futuro e "Conta fixa cadastrada."
- [ ] T020 [US4] Criar `FE/features/fixed-bills/components/fixed-bill-month-list.tsx` (combina `useRecurrences('Expense')`, `useMonthlySummary` e os detalhes das ativas com `useQueries`; usa `occurrence.ts`; R§2) e `ended-fixed-bills.tsx`; ligar caixa, menu de ocorrência (itens de pagar) e "Nova conta fixa" (`recurrence-form-dialog` com `kind = Expense`) em `FE/features/fixed-bills/pages/fixed-bills-page.tsx`

---

## Phase 7: User Story 5 - Ajustar um mês ou a recorrência (Priority: P2)

**Goal**: ajustar/pular/desfazer o mês; mudar valor, encerrar, reabrir, editar e remover; detalhe com histórico — nas duas telas.

**Independent Test**: US5-1..7 com o `financeStore`.

- [ ] T021 [P] [US5] Testes em `FE/features/recurrences/components/recurrence-adjustments.test.tsx`: "Ajustar este mês" (só o mês, marca "ajustado (normal R$ X)"); "Pular este mês" (marca "pulada", fora dos totais, sem caixa) e "Desfazer ajuste"; "Mudar valor" a partir de um mês (anteriores mantidos, histórico no detalhe); "Encerrar" e "Reabrir"; editar dados (sem valor/início) com "Recorrência atualizada."; remover com confirmação; os mesmos ajustes no salário pela tela de Receitas; detalhe aberto por `?recorrencia=id` e 404 fechando
- [ ] T022 [US5] Criar em `FE/features/recurrences/components/`: `adjust-month-dialog.tsx` (data-model.md `AdjustMonthForm.amount`), `change-amount-dialog.tsx` (`ChangeAmountForm.amount`, `ChangeAmountForm.fromMonth`), `end-recurrence-dialog.tsx` (`EndForm.endMonth`), `delete-recurrence-dialog.tsx` e `recurrence-detail-dialog.tsx` (dados, valor atual, histórico, meses ajustados/pulados/quitados, ações; FR-011); completar `occurrence-menu.tsx` com ajustar/pular/desfazer e os hooks em `FE/features/recurrences/hooks.ts` (R§6); abrir o detalhe pelas linhas das duas telas

---

## Phase 8: User Story 6 - Editar e remover receitas avulsas (Priority: P2)

**Goal**: detalhe da avulsa com editar e remover.

**Independent Test**: US6-1..2 com o `financeStore`.

- [ ] T023 [P] [US6] Testes em `FE/features/incomes/components/income-detail-dialog.test.tsx`: abrir pela linha (`?receita=id`), editar valor e data (muda de mês quando a data muda) com "Receita atualizada.", remover com confirmação e "Receita removida.", 404 fechando
- [ ] T024 [US6] Criar `FE/features/incomes/components/income-detail-dialog.tsx` (dados, receber/desfazer, Editar, Remover) com os hooks de editar/remover em `FE/features/incomes/hooks.ts` e o modo edição em `income-form-dialog.tsx` (sem "Já recebida" e sem troca de modo)

---

## Phase 9: User Story 7 - Dividir uma conta fixa com uma pessoa (Priority: P3)

**Goal**: pessoa e parte na conta fixa; ausente nas receitas recorrentes.

**Independent Test**: US7-1..3 com pessoas simuladas.

- [ ] T025 [P] [US7] Testes em `FE/features/recurrences/components/recurrence-person.test.tsx`: conta fixa com "Esposa" 50% mostra a parte por mês e "Esposa · 50%" na lista e no detalhe; integral envia 100; validações de data-model.md `RecurrenceForm.personId`/`RecurrenceForm.personPercent` (mesmas de ExpenseForm); sem pessoas, texto da área Pessoas; formulário de receita recorrente sem a opção
- [ ] T026 [US7] Adicionar ao `recurrence-form-dialog.tsx` o `PersonSplitFields` só quando `kind = Expense` (campos `splitWithPerson`, `personId`, `shareMode`, `personPercent` em `FE/features/recurrences/schemas.ts`) e mostrar "Pessoa · N%" na lista de contas fixas e no detalhe

---

## Phase 10: Polish & Cross-Cutting Concerns

- [ ] T027 [P] Conferir 360 px e 1920 px nas duas telas (sem rolagem horizontal; painéis vindo de baixo; totais sem corte) — FR-016, SC-006
- [ ] T028 Executar os cenários de [quickstart.md](quickstart.md) contra a API local com banco descartável (incluindo um reembolso real) e corrigir o que divergir do `financeStore`
- [ ] T029 `npm --prefix frontend test`, `lint` e `build` verdes (JS inicial ~337 kB); marcar tarefas concluídas

---

## Dependencies & Execution Order

```text
Setup → Foundational → US1 → US2 → US3 → US4 → US5 → US6 → US7 → Polish
                                      └──── US4 pode começar após a fundação (usa settle/menu da US2)
```

- **US2** cria a caixa/menu de ocorrência usados pela US4 e pela US5.
- **US3** cria o `recurrence-form-dialog` usado pela US4 (conta fixa), US5 (editar) e US7.
- **US5** completa o menu e cria o detalhe da recorrência, usado nas duas telas.
- **US6** só depende da US1/US3 (lista e formulário de avulsa).
- **US7** estende o formulário da US3.

### Parallel Opportunities

- T002, T003, T006, T007 na fundação.
- Testes [P] de cada história antes da implementação.
- T015/T017 (schemas) em paralelo com a US1/US2.

---

## Parallel Example: Foundational

```text
T002 tipos
T003 chaves de cache
T006 resumo mensal
T007 occurrence.ts
```

---

## Implementation Strategy

1. Fundação (inclui mover os compartilhados sem quebrar Despesas).
2. US1 + US2 + US3 → Receitas no dia a dia (**MVP**).
3. US4 → Contas fixas no dia a dia.
4. US5 → ajustes de recorrência nas duas telas.
5. US6 → editar/remover avulsas.
6. US7 → divisão de conta fixa com pessoa.
7. Polish com verificação contra a API real.

---

## Notes

- Nenhuma dependência npm nova (R§10).
- Componentes não chamam `fetch` direto; sempre hooks das features sobre `FE/lib/api.ts`.
- Totais da API (Receitas) ou somados de valores da API (Contas fixas); nenhum valor gravado a partir de cálculo da tela.
- Mensagens da API exibidas como vieram.
