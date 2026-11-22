---

description: "Task list for feature 010-frontend-monthly-summary (Tela de Resumo do Mês)"
---

# Tasks: Tela de Resumo do Mês

**Input**: Design documents from `/specs/010-frontend-monthly-summary/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md

**Tests**: obrigatórios pela constitution v1.2.0 (Princípio II): Vitest + Testing Library. Testes
antes da implementação em cada história.

**Organization**: tarefas por história de usuário (US1..US4).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história de usuário (US1..US4)

## Path Conventions

- `FE/` = `frontend/src/`

API, avisos, textos e componentes: [contracts/ui.md](contracts/ui.md). Derivações e endereço:
[data-model.md](data-model.md). Decisões: [research.md](research.md) (R§n).

---

## Phase 1: Setup

- [ ] T001 Conferir na branch `010-frontend-monthly-summary` que `npm --prefix frontend test` (205), `lint` e `build` passam; anotar o JS inicial (referência 339 kB)

---

## Phase 2: Foundational

- [ ] T002 [P] Criar `FE/features/summary/ledger.ts` com as derivações de data-model.md "Derivações de exibição" (`ledgerLink`, `ledgerShownAmount`, `ledgerLabel`, `heroOf`) e testes em `FE/features/summary/ledger.test.ts` (cada tipo de link, quitado/parcial, n/total, destaque com e sem acumulado e cada motivo)
- [ ] T003 [P] Criar `FE/test/summary-store.ts` (R§9): itens do resumo em memória por mês com previsto, realizado, pendências e acumulado configuráveis, respondendo `GET /summaries` (com filtro de categoria e sem acumulado/pendências quando filtrado) e quitar/desfazer de parcela, receita avulsa e ocorrência; e `FE/test/summary-setup.ts` (sessão e categorias de despesa e receita)
- [ ] T004 Criar `FE/features/summary/pages/summary-page.tsx` (título "Resumo do mês", `MonthPicker`, filtro, estado no endereço `mes`/`categoria`/`lista`; R§8) e ligar `/` (lazy) em `FE/app/router.tsx` (área "summary" deixa de ser "em construção"); ajustar o teste de navegação da 005 que usava o Resumo como área em construção

**Checkpoint**: `/` abre a página; derivações e store testados; testes anteriores verdes.

---

## Phase 3: User Story 1 - Ver o previsto e o realizado do mês (Priority: P1) 🎯 MVP

**Goal**: cartões previsto e realizado da API, saldo negativo em destaque, troca de mês, mês vazio.

**Independent Test**: US1-1..5 com o `summaryStore`.

- [ ] T005 [P] [US1] Testes em `FE/features/summary/components/summary-totals.test.tsx`: previsto (entradas, saídas, saldo) e realizado (recebido, pago, saldo) iguais aos da API; saldo negativo com alerta; trocar de mês atualiza e fica no endereço; mês vazio com "Nada lançado neste mês" e links para Despesas e Receitas; erro com "Tentar novamente"
- [ ] T006 [US1] Criar `FE/features/summary/components/summary-totals.tsx` e o estado vazio, e usá-los em `FE/features/summary/pages/summary-page.tsx`

---

## Phase 4: User Story 2 - Saldo acumulado (Priority: P1)

**Goal**: destaque "Saldo no fim do mês" ou saldo previsto com o motivo (clarify Q1).

**Independent Test**: US2-1..6 com o `summaryStore`.

- [ ] T007 [P] [US2] Testes em `FE/features/summary/components/summary-hero.test.tsx`: com acumulado mostra "Saldo no fim do mês", "veio de {mês anterior}" e saldo do mês; "projeção de fechamento" no mês atual e futuro; "fechamento realizado" em mês passado; sem saldo inicial mostra o saldo previsto e o link "Informar saldo inicial" para `/configuracoes`; com filtro e antes do saldo inicial mostra a explicação certa; valores negativos com alerta
- [ ] T008 [US2] Criar `FE/features/summary/components/summary-hero.tsx` (usa `heroOf`) como primeiro bloco de `summary-page.tsx`

---

## Phase 5: User Story 3 - Pendências de meses anteriores (Priority: P1)

**Goal**: no mês atual, totais a pagar/receber e itens resolvíveis num toque.

**Independent Test**: US3-1..5 com o `summaryStore`.

- [ ] T009 [P] [US3] Testes em `FE/features/summary/components/pending-section.test.tsx`: seção com "A pagar"/"A receber" e itens "{nome} · {mês}" da API; marcar pendência de conta fixa (`POST …/settlement` do mês de origem), parcela (`POST …/payment`) e receita (`POST …/receipt`) com aviso e saída da lista; reembolso sem caixa e com link para a pessoa; nome leva ao detalhe; sem pendências ou fora do mês atual a seção não aparece
- [ ] T010 [US3] Criar `FE/features/summary/components/ledger-toggle.tsx` (ação por tipo com o `PaymentToggle` compartilhado; R§4) e `FE/features/summary/components/pending-section.tsx`; usá-los em `summary-page.tsx`

**Checkpoint**: a tela inicial responde "quanto vai sobrar" e resolve pendências (**MVP**).

---

## Phase 6: User Story 4 - Itens do mês (Priority: P2)

**Goal**: abas Entradas/Saídas com filtro, links e caixa de pago/recebido (clarify Q2).

**Independent Test**: US4-1..5 com o `summaryStore`.

- [ ] T011 [P] [US4] Testes em `FE/features/summary/components/ledger-list.test.tsx`: abas com aba no endereço; itens em ordem com data, nome, categoria ou "reembolso", n/total, valor (parcial "de"), "antecipada"; filtro por categoria (grupos Despesas/Receitas) filtra listas e totais e some com os reembolsos; cada tipo abre o link certo; caixa marca e desmarca receita e parcela com aviso; reembolso sem caixa
- [ ] T012 [US4] Criar `FE/features/summary/components/ledger-list.tsx` (LedgerList + LedgerRow) e `summary-category-filter.tsx` (R§6, R§7) e usá-los em `summary-page.tsx`

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T013 [P] Conferir 360 px e 1920 px (sem rolagem horizontal; valores e destaque sem corte) — FR-012
- [ ] T014 Executar os cenários de [quickstart.md](quickstart.md) contra a API local com banco descartável (saldo inicial, pendência real de mês anterior) e corrigir o que divergir do `summaryStore`
- [ ] T015 `npm --prefix frontend test`, `lint` e `build` verdes (JS inicial ~339 kB); marcar tarefas concluídas

---

## Dependencies & Execution Order

```text
Setup → Foundational → US1 → US2 → US3 → US4 → Polish
```

- **US2** e **US1** usam a mesma resposta da API; o destaque (US2) fica acima dos cartões (US1).
- **US3** cria a `LedgerToggle`, reaproveitada nas listas da **US4**.

### Parallel Opportunities

- T002 e T003 na fundação.
- Testes [P] de cada história antes da implementação.

---

## Parallel Example: Foundational

```text
T002 ledger.ts
T003 summary-store.ts
```

---

## Implementation Strategy

1. Fundação + US1 + US2 + US3 → tela inicial útil: saldo no fim do mês, previsto/realizado e pendências (**MVP**).
2. US4 → listas com links e caixa de pago/recebido.
3. Polish com verificação contra a API real.

---

## Notes

- Nenhuma dependência npm nova (R§10).
- Totais, pendências e acumulado sempre da API; a tela só escolhe e formata.
- Ações de pago/recebido reaproveitam os hooks de Despesas, Receitas e Contas fixas.
