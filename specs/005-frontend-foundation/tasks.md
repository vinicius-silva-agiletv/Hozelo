---

description: "Task list for feature 005-frontend-foundation (Fundação do Frontend)"
---

# Tasks: Fundação do Frontend (Acesso e Navegação)

**Input**: Design documents from `/specs/005-frontend-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md

**Tests**: obrigatórios pela constitution v1.2.0 (Princípio III): Vitest + Testing Library para
utilitários, hooks e fluxos das telas. Testes antes da implementação em cada história.

**Organization**: tarefas por história de usuário. A US3 (sessão) vem antes de US1/US2 porque
entrar e cadastrar gravam a sessão.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história de usuário (US1..US5)

## Path Conventions

- `FE/` = `frontend/src/`

Rotas, API consumida e uso dos componentes: [contracts/ui.md](contracts/ui.md). Estados e
validações: [data-model.md](data-model.md). Decisões: [research.md](research.md) (R§n).

---

## Phase 1: Setup

- [X] T001 Conferir na branch `005-frontend-foundation` que `npm --prefix frontend test`, `lint` e `build` passam antes de começar; adicionar o componente `alert` do shadcn/ui (`npx shadcn@latest add alert`) em `FE/components/ui/alert.tsx`

---

## Phase 2: Foundational

- [X] T002 [P] Criar `FE/types/api.ts` com os tipos de data-model.md ("Tipos dos contratos consumidos")
- [X] T003 Estender `FE/lib/api.ts`: `setUnauthorizedHandler(fn)` chamado em 401 **só quando a requisição enviou token**; erro de rede vira `ApiError` status 0 com "Não foi possível conectar. Verifique sua conexão e tente novamente." (R§3, R§9); trocar `tokenStorage` por leitura da sessão (T008); testes em `FE/lib/api.test.ts`
- [X] T004 [P] Criar `FE/lib/month.ts` (`currentMonth`, `addMonths`, `formatMonth` "novembro de 2026", limites 2000-01..2100-12; data-model.md "MonthPicker") com testes em `FE/lib/month.test.ts`
- [X] T005 [P] Criar `FE/lib/use-document-title.ts` ("<título> · Hozelo") com teste
- [X] T006 [P] Criar `FE/test/mock-api.ts` (mapa "MÉTODO /caminho" → status/corpo sobre `fetch`) e estender `FE/test/render.tsx` com rota inicial (`initialPath`) usando `MemoryRouter`; ajustar `FE/app/providers.tsx` para receber o roteador de fora (BrowserRouter em `main.tsx`)

---

## Phase 3: User Story 3 - Manter a sessão e sair (Priority: P1, pré-requisito)

**Goal**: sessão persistente ou só da aba, expiração, 401 → entrada com aviso e volta à área.

**Independent Test**: US3-1..5 com sessão gravada manualmente e API simulada.

### Tests for User Story 3

- [X] T007 [P] [US3] Testes em `FE/features/auth/session-storage.test.ts`: gravar persistente/não persistente (data-model.md `Session.persistent`), ler dos dois, sair limpa os dois, token com `exp` vencido é descartado (data-model.md `Session.expiresAt`), token malformado é descartado
- [X] T008 [P] [US3] Testes em `FE/features/auth/session.test.tsx`: `useSession` (signIn/signOut), `RequireAuth` redireciona para `/entrar?voltar=...`, `RedirectIfAuthenticated` leva a `/`, 401 numa requisição com token encerra a sessão, limpa o cache e leva a `/entrar?expirada=1&voltar=...`

### Implementation for User Story 3

- [X] T009 [US3] Criar `FE/features/auth/session-storage.ts` (chave `hozelo.session` com `accessToken` e `accountName`; data-model.md `Session.accessToken`, `Session.accountName`, `Session.persistent`, `Session.expiresAt`; decodificação base64url do `exp`) (R§1, R§2)
- [X] T010 [US3] Criar `FE/features/auth/session.tsx`: `SessionProvider` (registra o handler de 401, limpa o `QueryClient`, navega com `voltar` validado como caminho interno), `useSession`, `RequireAuth`, `RedirectIfAuthenticated`; incluir o provider em `FE/app/providers.tsx`

**Checkpoint**: sessão e guardas testadas isoladamente.

---

## Phase 4: User Story 1 - Entrar na conta (Priority: P1) 🎯 MVP

**Goal**: tela de entrada com validação, mensagens da API e "Manter conectado".

**Independent Test**: US1-1..6.

- [X] T011 [P] [US1] Testes em `FE/features/auth/pages/login-page.test.tsx`: validação dos campos, 401 mostra a mensagem da API mantendo o e-mail, 429 mostra a mensagem, botão em processamento, "Manter conectado" marcado por padrão e desmarcado grava sessão não persistente, aviso de sessão expirada com `?expirada=1`, volta para `voltar` após entrar
- [X] T012 [P] [US1] Criar `FE/features/auth/schemas.ts` (entrar e cadastro; data-model.md "Validação dos formulários") e `FE/features/auth/api.ts` (`login`, `register`, `getProfile`)
- [X] T013 [US1] Criar `FE/features/auth/hooks.ts` (`useLogin`, `useRegister`, `useProfile`) e `FE/app/layouts/auth-layout.tsx` (cartão centralizado com a marca)
- [X] T014 [US1] Criar `FE/features/auth/pages/login-page.tsx` (campos com `Field`, checkbox "Manter conectado", alerta com as mensagens da API, link "Criar conta", título da aba)

---

## Phase 5: User Story 2 - Criar a conta da família (Priority: P1)

**Goal**: cadastro com validação; 409 orienta a entrar.

**Independent Test**: US2-1..4.

- [X] T015 [P] [US2] Testes em `FE/features/auth/pages/register-page.test.tsx`: validação (nome, e-mail, senha mínima 8), sucesso entra no app com sessão persistente, 409 mostra a mensagem + link "Ir para a entrada", 400 mostra todas as mensagens, links entre as telas
- [X] T016 [US2] Criar `FE/features/auth/pages/register-page.tsx`

---

## Phase 6: User Story 4 - Navegar entre as áreas (Priority: P1)

**Goal**: rotas protegidas, layout responsivo, páginas em construção, 404, títulos.

**Independent Test**: US4-1..7.

- [X] T017 [P] [US4] Testes em `FE/app/router.test.tsx`: sem sessão em `/despesas` → entrada; com sessão em `/entrar` → resumo; `/xyz` → 404 com atalho; cada área mostra título "em construção" e título da aba
- [X] T018 [P] [US4] Testes em `FE/app/layouts/app-layout.test.tsx`: menu lateral com as seis áreas e destaque da atual; barra do rodapé com 4 áreas + "Mais"; "Mais" abre Contas fixas, Configurações, nome da conta e Sair e fecha ao escolher; Sair encerra a sessão; nome vindo do perfil
- [X] T019 [US4] Criar `FE/app/navigation.ts` com as seis áreas (data-model.md `NavArea.key`, `NavArea.label`, `NavArea.path`, `NavArea.icon`, `NavArea.primaryOnMobile`)
- [X] T020 [US4] Criar `FE/app/layouts/sidebar-nav.tsx`, `FE/app/layouts/bottom-nav.tsx` (Sheet "Mais") e `FE/app/layouts/app-layout.tsx` (lateral em `md+`, rodapé abaixo, espaço inferior com safe area, nome com `title` quando longo) (R§7)
- [X] T021 [P] [US4] Criar `FE/pages/under-construction-page.tsx` e `FE/pages/not-found-page.tsx`
- [X] T022 [US4] Criar `FE/app/router.tsx` (rotas de contracts/ui.md com guardas e layouts), usar em `FE/App.tsx`, remover `FE/pages/home-page.tsx` e atualizar `FE/App.test.tsx`

**Checkpoint**: app navegável de ponta a ponta com a API real.

---

## Phase 7: User Story 5 - Elementos visuais compartilhados (Priority: P2)

**Goal**: componentes prontos para as próximas telas.

**Independent Test**: US5-1..5.

- [X] T023 [P] [US5] Testes e componente `FE/components/shared/money-input.tsx` (+ `.test.tsx`): dígitos entram pelos centavos, Backspace remove o último, letras ignoradas, colar "1.250,50" e "1250.5", limite, `inputMode="numeric"` (data-model.md "MoneyInput"; R§11)
- [X] T024 [P] [US5] Testes e componente `FE/components/shared/month-picker.tsx` (+ `.test.tsx`): anterior/próximo, virada de ano, "Mês atual", limites desabilitam botões, rótulos acessíveis (data-model.md "MonthPicker"; R§12)
- [X] T025 [P] [US5] Testes e componentes `FE/components/shared/page-header.tsx`, `FE/components/shared/empty-state.tsx` e `FE/components/shared/confirm-dialog.tsx` (Cancelar, confirmação destrutiva, processamento) (+ testes)
- [X] T026 [US5] Usar `PageHeader` e `EmptyState` nas páginas em construção e na 404 (validação real dos componentes)

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T027 Revisar acessibilidade: ordem de foco, foco visível, `aria-current` no menu, rótulos de botões só com ícone, anúncio das mensagens de erro (`role="alert"`)
- [X] T028 Conferir no navegador do painel: 360 px, 768 px e desktop, temas claro e escuro, sem rolagem horizontal
- [X] T029 Rodar `npm --prefix frontend test`, `lint` e `build`
- [X] T030 Executar o roteiro de [quickstart.md](quickstart.md) com a API real

---

## Dependencies & Execution Order

```text
Setup → Foundational → US3 (sessão) → US1 → US2
                                    └─────→ US4 → Polish
Foundational → US5 (independente; T026 depois da US4)
```

- **US3** antes de US1, US2 e US4 (todas usam a sessão).
- **US1** e **US2** compartilham `schemas.ts`, `api.ts` e `hooks.ts` (criados na US1).
- **US4** depende de US3 (guardas) e usa as páginas de acesso nas rotas.
- **US5** pode andar em paralelo desde a fundação (componentes isolados); T026 depende da US4.

### Parallel Opportunities

- T002, T004, T005, T006 na fundação.
- T023, T024, T025 (componentes) em paralelo com US1–US4.

---

## Parallel Example: User Story 5

```text
T023 MoneyInput
T024 MonthPicker
T025 PageHeader / EmptyState / ConfirmDialog
```

---

## Implementation Strategy

1. Fundação + US3 + US1 → já dá para entrar no app.
2. US2 → primeiro acesso.
3. US4 → navegação completa (**MVP utilizável**).
4. US5 → componentes para as próximas features.
5. Polish.

Um commit por etapa com testes verdes.

---

## Notes

- Nenhuma dependência npm nova (R§14).
- Páginas não chamam `fetch` direto; sempre hooks da feature sobre `FE/lib/api.ts` (constitution I).
- Mensagens da API exibidas como vieram (constitution II).
