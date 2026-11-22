---

description: "Task list for feature 009-frontend-people (Tela de Pessoas)"
---

# Tasks: Tela de Pessoas

**Input**: Design documents from `/specs/009-frontend-people/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md

**Tests**: obrigatórios pela constitution v1.2.0 (Princípio II): Vitest + Testing Library. Testes
antes da implementação em cada história.

**Organization**: tarefas por história de usuário (US1..US6).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história de usuário (US1..US6)

## Path Conventions

- `FE/` = `frontend/src/`

API, avisos, textos e componentes: [contracts/ui.md](contracts/ui.md). Tipos, validações, exibição,
endereço e cache: [data-model.md](data-model.md). Decisões: [research.md](research.md) (R§n).

---

## Phase 1: Setup

- [X] T001 Conferir na branch `009-frontend-people` que `npm --prefix frontend test` (182), `lint` e `build` passam; anotar o JS inicial (referência 338 kB)

---

## Phase 2: Foundational

- [X] T002 [P] Adicionar a `FE/types/api.ts` os tipos de data-model.md "Tipos" (`ChargeOriginType`, `ChargeStatus`, `RequestPerson`, cobrança, pagamento, item do extrato, extrato, origem e resumo geral)
- [X] T003 [P] Adicionar a `FE/lib/query-keys.ts` as chaves `personStatement(id, month)` e `personSummary(id)` (com prefixos `['person-statement']`/`['person-summary']`) e fazer as mutações de `FE/features/expenses/hooks.ts` e `FE/features/recurrences/hooks.ts` invalidarem `['people']`, `['person-statement']` e `['person-summary']` (R§4)
- [X] T004 [P] Adicionar `formatBalance` a `FE/lib/format.ts` (data-model.md "Exibição") com testes em `FE/lib/format.test.ts`
- [X] T005 Estender `FE/features/people/api.ts` com as chamadas de contracts/ui.md "API consumida" e `FE/features/people/hooks.ts` com `usePersonStatement`, `usePersonSummary` e as mutações (pessoa, pagamento, cobrança) invalidando as chaves de R§4 e `['summary']`
- [X] T006 Criar `FE/test/people-store.ts` (R§9): pessoas, cobranças (avulsas e semeadas como de despesa/conta fixa) e pagamentos em memória, com abatimento simplificado (escolhidas primeiro, depois mais antigas, sobra = crédito), respondendo `/people`, `/statement`, `/summary`, `/charges` e `/payments` (+ recusa de remover pessoa com lançamentos); e `FE/test/people-setup.ts`
- [X] T007 Criar `FE/features/people/pages/people-page.tsx` e `FE/features/people/pages/person-page.tsx` (cabeçalho, voltar, abas ligadas ao endereço) e ligar `/pessoas` e `/pessoas/:id` (lazy) em `FE/app/router.tsx` (área "people" deixa de ser "em construção")

**Checkpoint**: as duas rotas abrem; store e `formatBalance` testados; testes das features 005–008 verdes.

---

## Phase 3: User Story 1 - Ver e cadastrar as pessoas (Priority: P1) 🎯 MVP

**Goal**: lista com saldos, total geral, crédito; cadastrar, renomear, remover; estado vazio.

**Independent Test**: US1-1..6 com o `peopleStore`.

- [X] T008 [P] [US1] Testes em `FE/features/people/schemas.test.ts` para data-model.md `PersonForm.name`, `PaymentForm.amount`, `PaymentForm.paidOn`, `PaymentForm.notes`, `ChargeForm.description`, `ChargeForm.amount`, `ChargeForm.chargeDate`
- [X] T009 [P] [US1] Testes em `FE/features/people/components/people-list.test.tsx`: ordem alfabética com "Deve até agora" e "No mês" da API; total geral; crédito; cadastrar com "Pessoa cadastrada." e validações/recusa da API; renomear; remover com confirmação; remoção recusada no diálogo; estado vazio; erro com "Tentar novamente"; tocar abre `/pessoas/{id}`
- [X] T010 [P] [US1] Criar `FE/features/people/schemas.ts` (campos citados em T008)
- [X] T011 [US1] Criar `FE/features/people/components/people-list.tsx`, `person-form-dialog.tsx` e `delete-person-dialog.tsx` e usá-los em `FE/features/people/pages/people-page.tsx`

---

## Phase 4: User Story 2 - Ver o extrato do mês da pessoa (Priority: P1)

**Goal**: saldo anterior → cobranças com situação → total devido → pagamentos → saldo final.

**Independent Test**: US2-1..6 com o `peopleStore`.

- [X] T012 [P] [US2] Testes em `FE/features/people/components/statement-view.test.tsx`: blocos e valores da API; situação "paga" / "parcial · falta R$ X" / "em aberto"; parcela n/total; troca de mês com saldo anterior = saldo final anterior; crédito; mês sem lançamentos ("Nada lançado neste mês"); cobrança de despesa/conta fixa leva a `/despesas?despesa=` / `/contas-fixas?recorrencia=`; aba e mês no endereço; pessoa inexistente volta à lista com aviso
- [X] T013 [US2] Criar `FE/features/people/components/statement-view.tsx` e `charge-row.tsx` (data-model.md "Exibição") e usá-los na aba Extrato de `FE/features/people/pages/person-page.tsx`

---

## Phase 5: User Story 3 - Registrar um pagamento (Priority: P1)

**Goal**: pagamento pela lista ou pelo detalhe, com valor sugerido e escolha opcional de cobranças.

**Independent Test**: US3-1..5 com o `peopleStore`.

- [X] T014 [P] [US3] Testes em `FE/features/people/components/payment-form-dialog.test.tsx`: abrir pela lista e pelo detalhe com o valor sugerido = devido no mês (vazio quando não deve); registrar com "Pagamento registrado." e saldos atualizados; escolha recolhida em "Escolher o que este pagamento quita (opcional)" envia `chargeKeys` só quando há escolha; pagamento maior vira crédito; validações de data-model.md `PaymentForm.amount`/`PaymentForm.paidOn`; recusa da API no formulário
- [X] T015 [US3] Criar `FE/features/people/components/payment-form-dialog.tsx` (R§5; cobranças escolhíveis dos extratos do mês atual e anterior com `remaining > 0`) e abrir pela lista (`people-list.tsx`) e pelo detalhe (`person-page.tsx`)

**Checkpoint**: a área responde "quem deve quanto" e registra pagamentos (**MVP**).

---

## Phase 6: User Story 4 - Cobranças avulsas (Priority: P2)

**Goal**: lançar, editar e remover cobranças avulsas (sem observação, R§6).

**Independent Test**: US4-1..4 com o `peopleStore`.

- [X] T016 [P] [US4] Testes em `FE/features/people/components/charge-form-dialog.test.tsx`: lançar com "Cobrança lançada." e aparecer no extrato do mês da data; editar (descrição, valor, data) com "Cobrança atualizada."; remover com confirmação; cobranças de despesa/conta fixa sem editar/remover; validações de data-model.md `ChargeForm.description`, `ChargeForm.amount`, `ChargeForm.chargeDate`; sem campo de observação
- [X] T017 [US4] Criar `FE/features/people/components/charge-form-dialog.tsx` e `delete-entry-dialog.tsx`; ligar "Cobrança avulsa" no detalhe e o menu Editar/Remover nas cobranças `Manual` de `charge-row.tsx`

---

## Phase 7: User Story 5 - Resumo geral por origem (Priority: P2)

**Goal**: origens com vencidas, pago e falta; totais deve até hoje / no total / crédito não usado.

**Independent Test**: US5-1..4 com o `peopleStore`.

- [X] T018 [P] [US5] Testes em `FE/features/people/components/overview-view.test.tsx`: linha "N de M vencidas" com total, pago, falta e tipo de origem; conta fixa sem fim com "R$ X por mês · sem fim"; totais; tocar em despesa/conta fixa navega para o detalhe; aba no endereço
- [X] T019 [US5] Criar `FE/features/people/components/overview-view.tsx` e usá-lo na aba Resumo geral de `FE/features/people/pages/person-page.tsx`

---

## Phase 8: User Story 6 - Editar e remover pagamentos (Priority: P2)

**Goal**: corrigir ou remover pagamentos pelo extrato.

**Independent Test**: US6-1..2 com o `peopleStore`.

- [X] T020 [P] [US6] Testes em `FE/features/people/components/payment-edit.test.tsx`: editar valor/data/observação/cobranças escolhidas (pré-marcadas com os `chargeKeys` do pagamento) com "Pagamento atualizado."; remover com confirmação e "Pagamento removido."; saldos recalculados
- [X] T021 [US6] Adicionar o modo edição em `payment-form-dialog.tsx` e o menu Editar/Remover nos pagamentos de `statement-view.tsx` (usando `delete-entry-dialog.tsx`)

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T022 [P] Atalho de Receitas (FR-010): em `FE/features/incomes/components/income-month-list.tsx`, o reembolso navega para `/pessoas/{sourceId}?mes={mês}`; atualizar o teste em `income-month-list.test.tsx`
- [X] T023 [P] Conferir 360 px e 1920 px nas duas páginas (sem rolagem horizontal; painéis vindo de baixo) — FR-014
- [X] T024 Executar os cenários de [quickstart.md](quickstart.md) contra a API local com banco descartável e corrigir o que divergir do `peopleStore`
- [X] T025 `npm --prefix frontend test`, `lint` e `build` verdes (JS inicial ~338 kB); marcar tarefas concluídas

---

## Dependencies & Execution Order

```text
Setup → Foundational → US1 → US2 → US3 → US4 → US5 → US6 → Polish
```

- **US2** usa a página da pessoa aberta pela lista (US1).
- **US3** abre pela lista (US1) e pelo detalhe; as cobranças escolhíveis vêm do extrato (US2).
- **US4** e **US6** acrescentam menus às linhas do extrato (US2).
- **US5** só depende da página da pessoa.

### Parallel Opportunities

- T002, T003, T004 na fundação.
- Testes [P] de cada história antes da implementação.
- US5 em paralelo com US3/US4 (arquivos diferentes).

---

## Parallel Example: Foundational

```text
T002 tipos
T003 chaves de cache + invalidações
T004 formatBalance
```

---

## Implementation Strategy

1. Fundação + US1 + US2 + US3 → quem deve quanto, extrato e pagamento (**MVP**).
2. US4 → cobranças avulsas.
3. US5 → resumo geral.
4. US6 → corrigir pagamentos.
5. Polish (atalho de Receitas, 360 px, API real).

---

## Notes

- Nenhuma dependência npm nova (R§10).
- Saldos, situações e abatimento sempre da API; a tela só formata.
- Cobrança avulsa sem observação até o backend devolver a observação no extrato (R§6).
- Mensagens da API exibidas como vieram.

## Implementation Notes

- Testes: 205 (eram 182), estáveis em execuções repetidas; JS inicial 339 kB; telas sob demanda
  `people-page` (4 kB) e `person-page` (10 kB).
- Componentes agrupados por afinidade: `person-dialogs.tsx` (cadastrar/renomear/remover pessoa e
  remover lançamento), `entry-forms.tsx` (pagamento e cobrança avulsa), `charge-labels.ts` (textos de
  origem/situação e links), `statement-view.tsx`, `overview-view.tsx`, `people-list.tsx`.
- `usePeople` passou a ordenar por nome; mutações de despesas e recorrências invalidam as chaves de
  pessoas (`peopleDependentKeys`).
- Teste de navegação da 005 agora confere "em construção" no Resumo do mês (única área pendente).
- Verificação com a API real (banco descartável, removido): lista com saldos, pagamento pela lista com
  valor sugerido e cobrança escolhida (3/10 ficou paga), extrato, resumo geral, atalho do reembolso em
  Receitas abrindo `/pessoas/2?mes=…`, 360 px. Ajuste: o rótulo do botão do reembolso repetia
  "Reembolso" (a API já manda "Reembolso — Nome").
- Cobrança avulsa sem observação (R§6); o backend que devolve a observação está na branch
  `backend-statement-charge-notes` (sessão separada), ainda não integrado aqui.
