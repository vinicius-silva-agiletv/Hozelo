---

description: "Task list for feature 006-frontend-settings (Tela de Configurações)"
---

# Tasks: Tela de Configurações

**Input**: Design documents from `/specs/006-frontend-settings/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md

**Tests**: obrigatórios pela constitution v1.2.0 (Princípio II): Vitest + Testing Library. Testes
antes da implementação em cada história.

**Organization**: tarefas por história de usuário (US1..US5).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história de usuário (US1..US5)

## Path Conventions

- `FE/` = `frontend/src/`

API consumida, avisos e componentes: [contracts/ui.md](contracts/ui.md). Tipos, validações e estados:
[data-model.md](data-model.md). Decisões: [research.md](research.md) (R§n).

---

## Phase 1: Setup

- [ ] T001 Conferir na branch `006-frontend-settings` que `npm --prefix frontend test`, `lint` e `build` passam; anotar o tamanho atual do JS inicial do build (referência 563 kB, SC-005) em `specs/006-frontend-settings/quickstart.md` se divergir

---

## Phase 2: Foundational

- [ ] T002 [P] Adicionar a `FE/types/api.ts` os tipos de data-model.md "Tipos" (`CategoryType`, `ResponseCategory`, `ResponseCategories`, `RequestCategory`, `ResponseOpeningBalance`, `RequestOpeningBalance`)
- [ ] T003 [P] Criar `FE/lib/query-keys.ts` com as chaves de data-model.md "Chaves de cache" e trocar `profileQueryKey` em `FE/features/auth/hooks.ts` para usar `queryKeys.profile` (R§2)
- [ ] T004 [P] Adicionar `pluralize(n, singular, plural, zero?)` a `FE/lib/format.ts` com testes em `FE/lib/format.test.ts` (R§8)
- [ ] T005 [P] Criar `FE/lib/use-media-query.ts` (assina `matchMedia`, atualiza em `change`) com teste em `FE/lib/use-media-query.test.ts`
- [ ] T006 Estender `FE/test/mock-api.ts`: chaves com query string (`"GET /categories?type=Expense"`), resposta como função `(body) => {status, body}` e registro das chamadas feitas (para conferir corpo e ordem) (R§10)
- [ ] T007 Criar `FE/components/shared/responsive-dialog.tsx` (`ResponsiveDialog`, `ResponsiveDialogFooter`: `Dialog` a partir de 768 px, `Sheet side="bottom"` abaixo, via `useMediaQuery`) com teste em `FE/components/shared/responsive-dialog.test.tsx` cobrindo as duas larguras (R§4, FR-011)
- [ ] T008 Criar `FE/features/settings/pages/settings-page.tsx` (título "Configurações" via `useDocumentTitle`, `PageHeader`, espaços para as seções) e ligar `/configuracoes` a ela em `FE/app/router.tsx`

**Checkpoint**: `/configuracoes` abre a página vazia; fundação testada.

---

## Phase 3: User Story 1 - Ver e criar categorias (Priority: P1) 🎯 MVP

**Goal**: listar por tipo com contagem, criar categoria, estado vazio, usar sugestões.

**Independent Test**: US1-1..7 com a API simulada.

### Tests for User Story 1

- [ ] T009 [P] [US1] Testes em `FE/features/categories/schemas.test.ts` para data-model.md `CategoryForm.name` (vazio, só espaços, 51 caracteres, trim) e `CategoryForm.type`
- [ ] T010 [P] [US1] Testes em `FE/features/categories/components/categories-section.test.tsx`: abas Despesas/Receitas carregam `GET /categories?type=...`; contagem "Nenhum lançamento"/"1 lançamento"/"3 lançamentos"; esqueleto ao carregar; erro com "Tentar novamente"; estado vazio com "Nova categoria" e "Usar sugestões"; criar envia `{name, type}`, mostra "Categoria criada." e atualiza a lista; 409 mostra a mensagem da API no formulário
- [ ] T011 [P] [US1] Testes em `FE/features/categories/components/suggestions-dialog.test.tsx`: lista do tipo toda marcada; existentes desmarcadas com "já existe"; confirmar cria só as marcadas; falha parcial mostra "N categorias criadas." e "Nome: mensagem" das recusadas; botão desabilitado sem nenhuma marcada (data-model.md `SuggestionsForm.selected`)

### Implementation for User Story 1

- [ ] T012 [P] [US1] Criar `FE/features/categories/schemas.ts` (data-model.md `CategoryForm.name`, `CategoryForm.type`)
- [ ] T013 [P] [US1] Criar `FE/features/categories/suggestions.ts` com as listas por tipo (data-model.md "SuggestionsForm", R§6)
- [ ] T014 [US1] Criar `FE/features/categories/api.ts` (`list(type)`, `create`, `rename`, `remove`) e `FE/features/categories/hooks.ts` (`useCategories(type)`, `useCreateCategory`, `useCreateSuggestedCategories` com `Promise.allSettled` e retorno `{created, failures}`; invalidam `queryKeys.categories`) (contracts/ui.md "API consumida")
- [ ] T015 [US1] Criar `FE/features/categories/components/category-form-dialog.tsx` (`ResponsiveDialog`, React Hook Form + Zod, escolha do tipo, `ApiErrorAlert`, modo criar/renomear com tipo fixo ao renomear)
- [ ] T016 [US1] Criar `FE/features/categories/components/category-list.tsx` (nome, contagem com `pluralize`, ordem alfabética, espaço para o menu de ações) e `FE/features/categories/components/suggestions-dialog.tsx`
- [ ] T017 [US1] Criar `FE/features/categories/components/categories-section.tsx` (abas, estados de data-model.md "Estado da tela", botões "Nova categoria"/"Usar sugestões") e incluí-la em `FE/features/settings/pages/settings-page.tsx`

**Checkpoint**: categorias listadas e criadas, inclusive pelas sugestões.

---

## Phase 4: User Story 2 - Renomear e remover categorias (Priority: P1)

**Goal**: renomear (tipo fixo) e remover com confirmação, mostrando recusas da API.

**Independent Test**: US2-1..4 com a API simulada.

### Tests for User Story 2

- [ ] T018 [P] [US2] Testes em `FE/features/categories/components/category-actions.test.tsx`: menu "Renomear"/"Remover" por item; renomear envia `PUT /categories/{id}` `{name}`, mostra "Categoria renomeada."; 409 no formulário; remover pede confirmação, envia `DELETE`, mostra "Categoria removida."; 409 (com lançamentos) mantém o diálogo aberto com a mensagem e a categoria na lista

### Implementation for User Story 2

- [ ] T019 [US2] Adicionar `useRenameCategory` e `useDeleteCategory` a `FE/features/categories/hooks.ts`
- [ ] T020 [US2] Criar `FE/features/categories/components/delete-category-dialog.tsx` (`ConfirmDialog` destrutivo, erro da API dentro do diálogo, fecha só em sucesso; R§7) e o menu de ações (`DropdownMenu`) em `FE/features/categories/components/category-list.tsx`, reaproveitando `category-form-dialog.tsx` no modo renomear

**Checkpoint**: CRUD de categorias completo.

---

## Phase 5: User Story 3 - Informar o saldo inicial (Priority: P1)

**Goal**: ver, informar ou alterar o saldo inicial, com negativo e data padrão no dia 1º do mês.

**Independent Test**: US3-1..6 com a API simulada.

### Tests for User Story 3

- [ ] T021 [P] [US3] Testes em `FE/features/opening-balance/schemas.test.ts` para data-model.md `OpeningBalanceForm.amount`, `OpeningBalanceForm.negative`, `OpeningBalanceForm.referenceDate` e a conversão de envio
- [ ] T022 [P] [US3] Testes em `FE/features/opening-balance/components/opening-balance-section.test.tsx`: 404 mostra "não informado" e "Informar saldo inicial"; formulário com data padrão no dia 1º do mês atual e a dica; salvar envia `PUT /opening-balance`, mostra "Saldo inicial salvo." e o valor/data; negativo envia valor negativo e exibe com sinal e destaque; "Alterar" abre com os valores atuais (chave negativa ligada quando `amount < 0`); explicação do ponto de partida do saldo acumulado; erro de carregamento com "Tentar novamente"

### Implementation for User Story 3

- [ ] T023 [P] [US3] Criar `FE/features/opening-balance/schemas.ts` (data-model.md `OpeningBalanceForm.amount`, `OpeningBalanceForm.negative`, `OpeningBalanceForm.referenceDate`)
- [ ] T024 [US3] Criar `FE/features/opening-balance/api.ts` (`get` converte 404 em `null`, R§3; `save`) e `FE/features/opening-balance/hooks.ts` (`useOpeningBalance`, `useSaveOpeningBalance` invalidando `queryKeys.openingBalance`)
- [ ] T025 [US3] Criar `FE/features/opening-balance/components/opening-balance-form-dialog.tsx` (`ResponsiveDialog`, `MoneyInput`, `Switch` "Saldo negativo", `<input type="date">`, dica "Use o saldo que vocês tinham no início do mês", `ApiErrorAlert`; R§5)
- [ ] T026 [US3] Criar `FE/features/opening-balance/components/opening-balance-section.tsx` (estados de data-model.md "Estado da tela", `formatCurrency`/`formatDate`, explicação FR-008) e incluí-la em `FE/features/settings/pages/settings-page.tsx`

**Checkpoint**: saldo inicial informado e alterado pela tela.

---

## Phase 6: User Story 4 - Ver os dados da conta (Priority: P2)

**Goal**: nome e e-mail somente leitura e opção de sair.

**Independent Test**: US4-1..2 com a API simulada.

- [ ] T027 [P] [US4] Testes em `FE/features/settings/components/account-section.test.tsx`: mostra nome e e-mail de `GET /users`; esqueleto ao carregar; "Sair" encerra a sessão e leva a `/entrar`
- [ ] T028 [US4] Criar `FE/features/settings/components/account-section.tsx` (`useProfile`, `useSession().signOut`) e incluí-la em `FE/features/settings/pages/settings-page.tsx`

---

## Phase 7: User Story 5 - Telas carregadas sob demanda (Priority: P2)

**Goal**: cada tela baixada só quando acessada; falha de download com "Tentar de novo"; pacote inicial ≥ 30% menor.

**Independent Test**: US5-1..3; build com o JS inicial ≤ 394 kB.

- [ ] T029 [P] [US5] Testes em `FE/components/shared/route-error-boundary.test.tsx` (erro de carregamento mostra "Não foi possível carregar esta tela." e "Tentar de novo", que recarrega) e em `FE/app/router.test.tsx` (indicador aparece enquanto a tela carrega; rotas continuam abrindo as telas certas)
- [ ] T030 [P] [US5] Criar `FE/components/shared/page-loader.tsx` e `FE/components/shared/route-error-boundary.tsx` (R§9)
- [ ] T031 [US5] Em `FE/app/router.tsx`, carregar entrar, cadastro, configurações, em construção e 404 com `React.lazy`; `Suspense` com `PageLoader` e `RouteErrorBoundary` dentro de `AuthLayout`/`AppLayout` (menu continua visível); ajustar testes existentes que esperam a tela de forma síncrona (`findBy…`)
- [ ] T032 [US5] Rodar `npm --prefix frontend run build`, conferir JS inicial ≤ 394 kB (SC-005) e que o aviso de pacote > 500 kB sumiu; registrar o resultado

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T033 [P] Conferir 360 px e 1920 px no navegador (sem rolagem horizontal, formulários vindo de baixo no celular) — SC-006, FR-011
- [ ] T034 Executar os cenários de [quickstart.md](quickstart.md) contra a API local (conta descartável) e corrigir o que falhar
- [ ] T035 `npm --prefix frontend test`, `lint` e `build` verdes; marcar tarefas concluídas

---

## Dependencies & Execution Order

```text
Setup → Foundational → US1 → US2
                    ├→ US3
                    ├→ US4
                    └→ US5 (T031 depois de T008) → Polish
```

- **US2** depende da US1 (`hooks.ts`, `category-list.tsx`, `category-form-dialog.tsx`).
- **US3**, **US4** e **US5** só dependem da fundação; tocam `settings-page.tsx` em uma linha cada.

### Parallel Opportunities

- T002, T003, T004, T005 na fundação.
- Testes de cada história ([P]) antes da implementação.
- US3, US4 e US5 em paralelo com US1/US2 (arquivos diferentes, exceto a inclusão na página).

---

## Parallel Example: User Story 1

```text
T009 testes do schema
T010 testes da seção
T011 testes das sugestões
T012 schemas.ts
T013 suggestions.ts
```

---

## Implementation Strategy

1. Fundação + US1 → categorias criadas (**MVP**: já permite preparar as categorias).
2. US2 → CRUD completo.
3. US3 → saldo inicial.
4. US4 → conta.
5. US5 → divisão de código e medição.
6. Polish.

---

## Notes

- Nenhuma dependência npm nova (R§11).
- Componentes não chamam `fetch` direto; sempre hooks da feature sobre `FE/lib/api.ts`.
- Mensagens da API exibidas como vieram.
