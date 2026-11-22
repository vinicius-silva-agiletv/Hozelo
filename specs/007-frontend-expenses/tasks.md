---

description: "Task list for feature 007-frontend-expenses (Tela de Despesas)"
---

# Tasks: Tela de Despesas

**Input**: Design documents from `/specs/007-frontend-expenses/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md

**Tests**: obrigatórios pela constitution v1.2.0 (Princípio II): Vitest + Testing Library. Testes
antes da implementação em cada história.

**Organization**: tarefas por história de usuário (US1..US6). US3 (cadastrar) vem logo depois da
US1 porque as demais histórias precisam de despesas criadas pela tela para os testes de ponta a
ponta; os testes da US1/US2 usam o `expensesStore` já populado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história de usuário (US1..US6)

## Path Conventions

- `FE/` = `frontend/src/`

API consumida, avisos, textos e componentes: [contracts/ui.md](contracts/ui.md). Tipos,
validações, endereço e prévias: [data-model.md](data-model.md). Decisões: [research.md](research.md)
(R§n).

---

## Phase 1: Setup

- [X] T001 Conferir na branch `007-frontend-expenses` que `npm --prefix frontend test`, `lint` e `build` passam; anotar o tamanho do JS inicial (referência 337 kB)

---

## Phase 2: Foundational

- [X] T002 [P] Adicionar a `FE/types/api.ts` os tipos de data-model.md "Tipos" (`AmountType`, `ExpenseStatus`, `ResponseMonthlyInstallment(s)`, `ResponseShortExpense`, `ResponseExpenses`, `ResponseInstallment`, `ResponseExpense`, `RequestUpdateExpense`, `RequestRegisterExpense`, `RequestPayInstallment`, `RequestAmortizeExpense`, `ResponsePerson`, `ResponsePeople`)
- [X] T003 [P] Adicionar a `FE/lib/query-keys.ts` as chaves de data-model.md "Chaves de cache" (`installments`, `expenses`, `expense`, `people`)
- [X] T004 [P] Criar `FE/lib/date.ts` (`todayIso`, `isAfterToday`, `lastDayOfMonth`, `addMonthsToDate`; R§10) com testes em `FE/lib/date.test.ts`
- [X] T005 [P] Criar `FE/features/expenses/preview.ts` com as funções e exemplos de data-model.md "Prévias" (R§5) e testes em `FE/features/expenses/preview.test.ts` cobrindo cada exemplo, sobra de centavos, dia 31 e limites
- [X] T006 Criar `FE/features/expenses/api.ts` (listar parcelas do mês, listar despesas, detalhe, cadastrar, editar, remover, pagar, desfazer, amortizar; contracts/ui.md "API consumida") e `FE/features/people/api.ts` + `FE/features/people/hooks.ts` (`usePeople`)
- [X] T007 Criar `FE/test/expenses-store.ts` (R§11): despesas em memória com geração de parcelas (mesma regra de `preview.ts`), totais do mês, antecipadas, lista com filtros e ordem, detalhe, cadastro/edição/remoção, pagar/desfazer e amortização, devolvendo as rotas para `mockApi`
- [X] T008 Criar `FE/features/expenses/use-expenses-url.ts` (data-model.md "Estado no endereço": leitura com padrões e valores inválidos; `replace` para mês/filtros, `push` para abrir detalhe; R§2) com testes em `FE/features/expenses/use-expenses-url.test.tsx`
- [X] T009 Criar `FE/features/expenses/pages/expenses-page.tsx` (título "Despesas", `PageHeader` com "Nova despesa", abas Mês/Todas ligadas ao endereço) e ligar `/despesas` a ela (lazy) em `FE/app/router.tsx`

**Checkpoint**: `/despesas` abre com as abas; prévias, datas, endereço e store testados.

---

## Phase 3: User Story 1 - Ver as despesas do mês (Priority: P1) 🎯 MVP

**Goal**: parcelas e totais do mês, troca de mês, filtro por categoria, antecipadas, estado vazio.

**Independent Test**: US1-1..6 com o `expensesStore` populado.

### Tests for User Story 1

- [X] T010 [P] [US1] Testes em `FE/features/expenses/components/month-view.test.tsx`: parcelas em ordem com data, nome, categoria, n/total e valor; totais Total/Pago/Em aberto iguais aos da API; trocar mês atualiza lista e endereço; filtro de categoria; parcela antecipada aparece no mês do pagamento com "antecipada"; mês vazio com "Nova despesa"; endereço com mês/categoria inválidos cai nos padrões; erro com "Tentar novamente"

### Implementation for User Story 1

- [X] T011 [US1] Adicionar `useMonthlyInstallments(month, categoryId)` a `FE/features/expenses/hooks.ts`
- [X] T012 [US1] Criar `FE/features/expenses/components/installment-row.tsx` (dados e marcas "antecipada"/"amortizada"; caixa de pago e menu ficam para a US2; tocar abre o detalhe via endereço)
- [X] T013 [US1] Criar `FE/features/expenses/components/month-view.tsx` (`MonthPicker`, filtro de categoria com `Select` e `useCategories('Expense')`, cartões de totais, lista, estados de carregamento/erro/vazio) e usá-la na aba Mês de `FE/features/expenses/pages/expenses-page.tsx`

**Checkpoint**: visão do mês navegável e filtrável.

---

## Phase 4: User Story 3 - Cadastrar uma despesa (Priority: P1)

**Goal**: cadastro à vista/parcelado, total/parcela, sugestão de pagas, vencimento padrão, resumo.

**Independent Test**: US3-1..8 com o `expensesStore`.

### Tests for User Story 3

- [X] T014 [P] [US3] Testes em `FE/features/expenses/schemas.test.ts` para data-model.md `ExpenseForm.name`, `ExpenseForm.categoryId`, `ExpenseForm.amount`, `ExpenseForm.installmentsCount`, `ExpenseForm.firstDueDate`, `ExpenseForm.alreadyPaidInstallments`, `ExpenseForm.notes` e a conversão para o envio
- [X] T015 [P] [US3] Testes em `FE/features/expenses/components/expense-form-dialog.test.tsx`: resumo "10 × R$ 350,00 · última em …"; modo parcela mostra o total; sobra de centavos; sugestão de 42 pagas para 48× desde 15/05/2023 que para de acompanhar após editar o campo; à vista = 1 parcela; vencimento padrão no mês aberto (dezembro → dia de hoje em dezembro; dia inexistente → último dia); mensagens de validação; recusa da API no formulário; sem categorias → aviso com link para Configurações; ao salvar envia o corpo esperado, mostra "Despesa cadastrada." e a parcela aparece no mês

### Implementation for User Story 3

- [X] T016 [P] [US3] Criar `FE/features/expenses/schemas.ts` (data-model.md `ExpenseForm.name`, `ExpenseForm.categoryId`, `ExpenseForm.amountType`, `ExpenseForm.amount`, `ExpenseForm.isInstallment`, `ExpenseForm.installmentsCount`, `ExpenseForm.firstDueDate`, `ExpenseForm.alreadyPaidInstallments`, `ExpenseForm.notes`; pessoa fica para a US6) e as funções `toRequest`/`toForm`
- [X] T017 [US3] Adicionar `useCreateExpense` a `FE/features/expenses/hooks.ts` (invalida `installments`, `expenses`, `categories`; R§3)
- [X] T018 [US3] Criar `FE/features/expenses/components/expense-form-dialog.tsx` (`ResponsiveDialog`, React Hook Form + Zod, grupos de opções, `Select` de categoria, `MoneyInput`, `<input type="date">`, sugestão de pagas com `dirtyFields`, resumo com `preview.ts`; R§6) e abri-lo pelo "Nova despesa" da página e do estado vazio

**Checkpoint**: cadastro completo pela tela (**MVP**: ver o mês + cadastrar).

---

## Phase 5: User Story 2 - Marcar parcela como paga ou desfazer (Priority: P1)

**Goal**: pagar/desfazer em um toque, pagar em outra data, confirmação para amortizada.

**Independent Test**: US2-1..5 com o `expensesStore`.

### Tests for User Story 2

- [X] T019 [P] [US2] Testes em `FE/features/expenses/components/installment-payment.test.tsx`: marcar paga envia `POST …/payment`, caixa marcada na hora e travada até a resposta, totais atualizados pela API, aviso "Parcela marcada como paga."; desfazer com "Pagamento desfeito."; clique duplo envia uma vez só; "Pagar em outra data" recusa data futura (data-model.md `PayOnDateForm.paidOn`) e envia a escolhida; desfazer amortizada pede confirmação; erro da API desfaz a marcação e mostra a mensagem

### Implementation for User Story 2

- [X] T020 [US2] Adicionar `usePayInstallment` e `useUndoInstallmentPayment` a `FE/features/expenses/hooks.ts` (atualização otimista do `isPaid`, grava `['expense', id]`, invalida listas; R§3, R§4)
- [X] T021 [US2] Criar `FE/features/expenses/components/pay-on-date-dialog.tsx` (data-model.md `PayOnDateForm.paidOn`) e completar `FE/features/expenses/components/installment-row.tsx` com a caixa de pago, o menu "Pagar em outra data" e a confirmação para amortizada (contracts/ui.md "Textos fixos")

**Checkpoint**: o dia a dia do mês funciona (ver, cadastrar, pagar).

---

## Phase 6: User Story 4 - Ver, editar e remover uma despesa (Priority: P2)

**Goal**: aba Todas, detalhe com parcelas, edição no mesmo modo de valor, remoção com confirmação.

**Independent Test**: US4-1..5 com o `expensesStore`.

### Tests for User Story 4

- [X] T022 [P] [US4] Testes em `FE/features/expenses/components/all-expenses-view.test.tsx`: ordem pelo próximo vencimento (quitadas por último), dados de cada despesa, totais pago/restante, filtros de categoria e situação no endereço, estado vazio, erro
- [X] T023 [P] [US4] Testes em `FE/features/expenses/components/expense-detail-dialog.test.tsx`: abrir por toque na parcela e por `?despesa=id`; dados, pago, desconto, restante e parcelas (com pagar/desfazer ali também); editar abre preenchido no mesmo modo de valor e sem "parcelas já pagas", salva com "Despesa atualizada."; recusa da API (amortizadas) no formulário; remover com confirmação e "Despesa removida."; 404 fecha o detalhe e atualiza as listas; "voltar" fecha o detalhe

### Implementation for User Story 4

- [X] T024 [US4] Adicionar `useExpenses(filters)`, `useExpense(id)`, `useUpdateExpense` e `useDeleteExpense` a `FE/features/expenses/hooks.ts` (R§3)
- [X] T025 [US4] Criar `FE/features/expenses/components/all-expenses-view.tsx` e usá-la na aba Todas de `FE/features/expenses/pages/expenses-page.tsx`
- [X] T026 [US4] Criar `FE/features/expenses/components/expense-detail-dialog.tsx` (aberto por `despesa` no endereço; lista de parcelas com `installment-row`; ações Editar/Amortizar/Remover; R§7), `FE/features/expenses/components/delete-expense-dialog.tsx` e o modo edição em `expense-form-dialog.tsx`

**Checkpoint**: CRUD completo de despesas.

---

## Phase 7: User Story 5 - Amortizar parcelas futuras (Priority: P2)

**Goal**: amortizar as últimas N ou parcelas escolhidas, com data e valor pago, mostrando o desconto.

**Independent Test**: US5-1..4 com o `expensesStore`.

- [X] T027 [P] [US5] Testes em `FE/features/expenses/components/amortize-dialog.test.tsx`: "as 6 últimas" com R$ 5.400,00 mostra "6 parcelas · R$ 6.000,00 · desconto de R$ 600,00" e envia `quantity`; modo "Escolher" envia `installmentNumbers`; validações de data-model.md `AmortizeForm.quantity`, `AmortizeForm.installmentNumbers`, `AmortizeForm.paidOn`, `AmortizeForm.paidAmount`; sucesso com "Amortização registrada.", parcelas "amortizadas" no detalhe e "antecipadas" no mês do pagamento
- [X] T028 [US5] Adicionar `useAmortizeExpense` a `FE/features/expenses/hooks.ts` e criar `FE/features/expenses/components/amortize-dialog.tsx` (data-model.md `AmortizeForm.mode`, `AmortizeForm.quantity`, `AmortizeForm.installmentNumbers`, `AmortizeForm.paidOn`, `AmortizeForm.paidAmount`; prévia com `amortizationPreview`; R§8), aberto pelo detalhe

---

## Phase 8: User Story 6 - Dividir a despesa com uma pessoa (Priority: P3)

**Goal**: escolher pessoa e parte (integral ou %), mostrar a parte por parcela, remover a indicação.

**Independent Test**: US6-1..5 com pessoas simuladas em `GET /people`.

- [X] T029 [P] [US6] Testes em `FE/features/expenses/components/expense-person.test.tsx`: integral envia `personPercent = 100`; percentual 50 mostra "R$ 175,00 por parcela" e envia 50; percentual fora de 1–100 e pessoa não escolhida mostram mensagem (data-model.md `ExpenseForm.personId`, `ExpenseForm.personPercent`); sem pessoas, opção desabilitada com o texto da área Pessoas; edição remove a pessoa (envia `null`); lista e detalhe mostram "Pessoa · 50%"
- [X] T030 [US6] Adicionar a `FE/features/expenses/schemas.ts` os campos data-model.md `ExpenseForm.splitWithPerson`, `ExpenseForm.personId`, `ExpenseForm.shareMode`, `ExpenseForm.personPercent` e a seção "Dividir com uma pessoa" em `FE/features/expenses/components/expense-form-dialog.tsx` (`usePeople`, `personShare`); mostrar "Pessoa · N%" em `all-expenses-view.tsx` e `expense-detail-dialog.tsx`

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T031 [P] Conferir 360 px e 1920 px no navegador (sem rolagem horizontal; formulários e detalhe vindo de baixo; detalhe com 48+ parcelas rolando dentro do painel) — FR-017, SC-006
- [X] T032 Executar os cenários de [quickstart.md](quickstart.md) contra a API local com banco descartável e corrigir o que falhar
- [X] T033 `npm --prefix frontend test`, `lint` e `build` verdes (JS inicial ~337 kB); marcar tarefas concluídas

---

## Dependencies & Execution Order

```text
Setup → Foundational → US1 → US3 → US2 → US4 → US5
                                       └──────→ US6 → Polish
```

- **US1** primeiro: a página e a lista do mês são a base onde as demais ações aparecem.
- **US3** depois da US1: o cadastro abre a partir da página/estado vazio e a nova parcela aparece no mês.
- **US2** usa `installment-row` (US1); o detalhe (US4) reaproveita a linha com a caixa de pago.
- **US5** abre a partir do detalhe (US4).
- **US6** estende o formulário (US3) e o detalhe/lista (US4).

### Parallel Opportunities

- T002, T003, T004, T005 na fundação.
- Os testes [P] de cada história antes da implementação.
- T014 e T016 (schemas) em paralelo com a US1.

---

## Parallel Example: Foundational

```text
T002 tipos
T003 chaves de cache
T004 lib/date.ts
T005 preview.ts
```

---

## Implementation Strategy

1. Fundação + US1 + US3 → ver o mês e cadastrar (**MVP**).
2. US2 → pagar e desfazer no dia a dia.
3. US4 → aba Todas, detalhe, editar e remover.
4. US5 → amortização.
5. US6 → divisão com pessoa.
6. Polish.

---

## Notes

- Nenhuma dependência npm nova (R§12).
- Componentes não chamam `fetch` direto; sempre hooks da feature sobre `FE/lib/api.ts`.
- Totais sempre da API; `preview.ts` só para exibir antes de salvar.
- Mensagens da API exibidas como vieram.

## Implementation Notes

- Testes: 134 (eram 79), estáveis em execuções repetidas; JS inicial 337 kB (a tela fica no pacote
  `expenses-page`, 48 kB, baixado sob demanda).
- Filtros e seletores usam `NativeSelect` (lista nativa com o visual dos campos) em vez do `Select`
  do Radix: melhor no celular e testável sem simular ponteiro.
- `MonthPicker` ganhou escolha direta (grade de meses do ano), cobrindo a "escolha direta" de FR-002/SC-005.
- Visão do mês: parcela paga mostra o valor efetivamente pago (a API manda o valor da parcela e o pago
  separados; numa amortizada com desconto, R$ 1.000,00 → R$ 900,00). Achado na verificação com a API real.
- Marcar como pago: trava síncrona que só destrava depois do render com a resposta (toque duplo não
  envia duas vezes).
- Remover: o cache da despesa não é apagado no sucesso, para o detalhe continuar montado e fechar pelo
  próprio fluxo (antes fechava pelo caminho de 404 com aviso indevido).
- Testes de ponta a ponta usam `FE/test/expenses-store.ts` + `FE/test/expenses-setup.ts`; `mockApi`
  aceita a rota coringa `*`; esperas do Testing Library com 3 s (telas sob demanda em paralelo).
- T032: cenários conferidos no navegador contra API temporária com banco descartável (removido depois):
  cadastro parcelado com divisão 50%, pagar, amortizar 6 com desconto, antecipadas no mês, aba Todas,
  360 px sem rolagem horizontal com detalhe vindo de baixo.
