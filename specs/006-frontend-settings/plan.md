# Implementation Plan: Tela de Configurações

**Branch**: `006-frontend-settings` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/006-frontend-settings/spec.md`

## Summary

A rota `/configuracoes` vira uma tela real com três seções: **Categorias** (abas Despesas/Receitas,
contagem de lançamentos, criar, renomear, remover com confirmação, sugestões iniciais), **Saldo
inicial** (ver, informar ou alterar, com opção de saldo negativo e data padrão no dia 1º do mês) e
**Conta** (nome, e-mail e Sair). Formulários abrem em painel responsivo (diálogo no computador,
painel de baixo no celular). Todas as telas passam a ser carregadas sob demanda, reduzindo o pacote
inicial em ao menos 30%. Só frontend: consome endpoints já existentes da API.

## Technical Context

**Language/Version**: TypeScript 6, React 19
**Primary Dependencies**: Vite 8, Tailwind 4, shadcn/ui (Radix), React Router 8, TanStack Query 5,
React Hook Form + Zod 4, Sonner — nenhuma dependência nova (R§11)
**Storage**: N/A (dados vêm da API; sessão já tratada pela 005)
**Testing**: Vitest 5 + Testing Library + jsdom, `mockApi` (estendido para query string, R§10)
**Target Platform**: navegadores modernos, celular (≥ 360 px) e computador
**Project Type**: web (frontend React consumindo a API .NET existente)
**Performance Goals**: pacote JS inicial ≤ 394 kB (−30% de 563 kB) — SC-005
**Constraints**: mensagens da API exibidas como vieram; sem rolagem horizontal em 360 px; pt-BR
**Scale/Scope**: 1 página, 3 seções, ~5 componentes de feature, 3 componentes compartilhados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.2.0.

| Princípio | Verificação | Status |
|---|---|---|
| I. Arquitetura em camadas / organização por feature | `features/categories`, `features/opening-balance`, `features/settings`; compartilhados em `components/shared` e `lib`; tipos em `types/api.ts` | ✅ |
| II. Testes | testes de componente/integração para cada história (R§10); lint e build no fluxo | ✅ |
| III. Validação e mensagens | Zod nos formulários; erros da API mostrados como vieram (`ApiErrorAlert`); textos em pt-BR | ✅ |
| IV. Segurança | sem dados sensíveis novos; rotas sob `RequireAuth`; token pelo cliente HTTP existente | ✅ |
| V. Simplicidade | sem endpoint novo (sugestões por chamadas individuais, R§6); sem dependência nova; input de data nativo | ✅ |

Sem violações — Complexity Tracking vazio.

**Re-check pós-design**: ✅ — data-model e contrato de UI não introduzem camadas, dependências ou
endpoints novos.

## Project Structure

### Documentation (this feature)

```text
specs/006-frontend-settings/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

```text
frontend/src/
├── app/
│   └── router.tsx                       # lazy + Suspense + RouteErrorBoundary; /configuracoes → SettingsPage
├── components/shared/
│   ├── responsive-dialog.tsx            # novo (R§4)
│   ├── page-loader.tsx                  # novo (R§9)
│   └── route-error-boundary.tsx         # novo (R§9)
├── features/
│   ├── categories/
│   │   ├── api.ts  hooks.ts  schemas.ts  suggestions.ts
│   │   └── components/
│   │       ├── categories-section.tsx   # abas Despesas/Receitas
│   │       ├── category-list.tsx
│   │       ├── category-form-dialog.tsx
│   │       ├── delete-category-dialog.tsx
│   │       └── suggestions-dialog.tsx
│   ├── opening-balance/
│   │   ├── api.ts  hooks.ts  schemas.ts
│   │   └── components/
│   │       ├── opening-balance-section.tsx
│   │       └── opening-balance-form-dialog.tsx
│   └── settings/
│       ├── components/account-section.tsx
│       └── pages/settings-page.tsx
├── lib/
│   ├── format.ts                        # + pluralize
│   ├── query-keys.ts                    # novo
│   └── use-media-query.ts               # novo
├── test/mock-api.ts                     # + query string e handlers por função
└── types/api.ts                         # + categorias e saldo inicial
```

**Structure Decision**: segue a estrutura do frontend definida na constitution v1.2.0 e usada na
005; categorias e saldo inicial ficam em features próprias para serem reutilizadas pelas telas de
despesas, receitas e resumo.

## Complexity Tracking

Nenhuma violação a justificar.
