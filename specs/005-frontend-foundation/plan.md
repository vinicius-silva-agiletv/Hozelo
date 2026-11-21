# Implementation Plan: Fundação do Frontend (Acesso e Navegação)

**Branch**: `005-frontend-foundation` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-frontend-foundation/spec.md`

## Summary

Esta feature entrega a casca do app web:

- telas de entrada (com "Manter conectado") e de cadastro, usando a API da feature 001;
- sessão guardada no navegador (`localStorage` ou `sessionStorage`), encerrada por 401 em
  requisições com token, com volta para a área em que a pessoa estava;
- rotas protegidas;
- layout com menu lateral no desktop e barra no rodapé + "Mais" no celular;
- páginas "em construção" para as seis áreas e página 404;
- os componentes compartilhados que as próximas telas vão usar: `PageHeader`, `EmptyState`,
  `MoneyInput` (estilo app de banco), `MonthPicker` e `ConfirmDialog`.

Nenhuma dependência nova. Detalhes em [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 6, React 19 (Vite 8)

**Primary Dependencies**: já instaladas: Tailwind CSS 4, shadcn/ui, React Router, TanStack Query,
React Hook Form + Zod, Sonner, Lucide

**Storage**: `localStorage` / `sessionStorage` (sessão no navegador); nenhum dado novo no servidor

**Testing**: Vitest + Testing Library + jsdom, `fetch` simulado por helper

**Target Platform**: navegadores modernos (desktop e celular), a partir de 360 px de largura

**Project Type**: web app (SPA) consumindo a API REST existente

**Performance Goals**: telas de acesso e navegação respondem de imediato; bundle inicial pequeno
(sem bibliotecas novas)

**Constraints**: textos em pt-BR; token só no header `Authorization`; 401 com token → entrada;
acessível por teclado e leitor de tela

**Scale/Scope**: 2 telas de acesso, 1 layout responsivo, 6 páginas provisórias, 404, 5 componentes
compartilhados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação | Status |
|---|---|---|
| I. Arquitetura (frontend por feature) | `features/auth` (api, hooks, schemas, session, pages); `app/` com rotas, layouts e navegação; `components/shared` sem acesso à API; telas usam hooks, não `fetch` | ✅ |
| I. Responsivo e acessível | Layout mobile first, barra do rodapé, componentes Radix, rótulos e foco visível (FR-023) | ✅ |
| II. Idioma | Textos em pt-BR, valores em R$, mensagens da API exibidas como vieram; URLs em português por serem texto de interface | ✅ |
| III. Testes | Vitest + Testing Library para utilitários, sessão, cliente HTTP, guardas, fluxos e componentes | ✅ |
| IV. Segurança | Token só em `Authorization`; 401 encerra sessão; nenhum segredo em `VITE_*`; redirecionamento `voltar` só para caminhos internos | ✅ |
| V. Simplicidade | Sem dependências novas; rotas declarativas; helper de `fetch` em vez de MSW | ✅ |

**Re-check pós-design**: ✅ sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/005-frontend-foundation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code

```text
frontend/src/
├── app/
│   ├── providers.tsx            # + SessionProvider
│   ├── router.tsx               # rotas, guardas, 404
│   ├── navigation.ts            # as seis áreas (label, path, ícone, primaryOnMobile)
│   └── layouts/
│       ├── auth-layout.tsx      # telas de acesso (centralizado)
│       ├── app-layout.tsx       # menu lateral (md+) e barra do rodapé (< md)
│       ├── sidebar-nav.tsx
│       └── bottom-nav.tsx       # 4 áreas + "Mais" (Sheet)
├── features/auth/
│   ├── api.ts                   # login, register, getProfile
│   ├── hooks.ts                 # useLogin, useRegister, useProfile
│   ├── schemas.ts               # Zod
│   ├── session.tsx              # SessionProvider, useSession, RequireAuth, RedirectIfAuthenticated
│   ├── session-storage.ts       # local/session storage + exp do JWT
│   └── pages/                   # login-page.tsx, register-page.tsx
├── pages/
│   ├── under-construction-page.tsx
│   └── not-found-page.tsx
├── components/shared/           # page-header, empty-state, money-input, month-picker, confirm-dialog
├── lib/
│   ├── api.ts                   # + handler de 401, erro de rede
│   ├── month.ts                 # utilitários de "yyyy-MM"
│   └── use-document-title.ts
├── types/api.ts
└── test/                        # setup, render (com rota inicial), mock-api
```

A página provisória `pages/home-page.tsx` do setup é removida: o Resumo do mês passa a ser a página
"em construção" até a feature dele.

**Structure Decision**: segue a constitution v1.2.0 (organização por feature).

## Ordem de implementação (insumo para /speckit-tasks)

1. **Fundação técnica**: tipos da API, `lib/api.ts` (handler 401, erro de rede), `lib/month.ts`,
   `use-document-title`, helpers de teste (`mock-api`, render com rota).
2. **US3 Sessão** (pré-requisito de US1/US2): `session-storage` (armazenamento + `exp`),
   `SessionProvider`, `useSession`, guardas.
3. **US1 Entrar** e **US2 Criar conta**: api, hooks, schemas, páginas, layout de acesso.
4. **US4 Navegação**: `navigation.ts`, layout do app (lateral + rodapé + "Mais"), páginas em
   construção, 404, títulos, rotas.
5. **US5 Componentes compartilhados**: `PageHeader`, `EmptyState`, `MoneyInput`, `MonthPicker`,
   `ConfirmDialog`.
6. **Acabamento**: acessibilidade (teclado/foco), 360 px, quickstart com a API real.

## Complexity Tracking

Não se aplica: nenhuma violação da constitution.
