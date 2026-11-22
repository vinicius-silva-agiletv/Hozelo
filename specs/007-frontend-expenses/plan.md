# Implementation Plan: Tela de Despesas

**Branch**: `007-frontend-expenses` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/007-frontend-expenses/spec.md`

## Summary

A rota `/despesas` vira a tela de despesas com duas abas: **Mês** (parcelas do mês com totais,
seletor de mês, filtro por categoria e marcação de pago na própria lista) e **Todas** (despesas com
situação, pago e restante). O detalhe da despesa mostra todas as parcelas e dá acesso a editar,
remover e amortizar. O formulário de cadastro/edição cobre à vista ou parcelado, valor total ou por
parcela, sugestão de parcelas já pagas, vencimento padrão no mês aberto e divisão com uma pessoa,
com um resumo calculado antes de salvar. Só frontend: consome os endpoints existentes das features
002 e 004.

## Technical Context

**Language/Version**: TypeScript 6, React 19
**Primary Dependencies**: Vite 8, Tailwind 4, shadcn/ui (Radix), React Router 8, TanStack Query 5,
React Hook Form + Zod 4, Sonner — nenhuma dependência nova (R§12)
**Storage**: N/A (dados da API; estado de navegação no endereço, R§2)
**Testing**: Vitest 5 + Testing Library + jsdom; `expensesStore` em memória (R§11)
**Target Platform**: navegadores modernos, celular (≥ 360 px) e computador
**Project Type**: web (frontend React consumindo a API .NET existente)
**Performance Goals**: totais do mês atualizados < 1 s após a resposta (SC-002); JS inicial
mantido (~337 kB), tela no próprio pacote sob demanda
**Constraints**: totais sempre da API (SC-003); prévias só para exibição; mensagens da API como
vieram; pt-BR; sem rolagem horizontal em 360 px
**Scale/Scope**: 1 página, 2 visões, ~8 componentes, até 480 parcelas por despesa

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.2.0.

| Princípio | Verificação | Status |
|---|---|---|
| I. Arquitetura / organização por feature | `features/expenses` (api, hooks, schemas, preview, componentes, página) e `features/people` (api, hooks); usa hooks públicos de `categories`; tipos em `types/api.ts` | ✅ |
| II. Testes | testes de `preview.ts`, `lib/date.ts`, schemas e fluxos de cada história com `expensesStore`; lint e build | ✅ |
| III. Validação e mensagens | Zod nos formulários com as mesmas regras da API; erros da API como vieram; textos pt-BR, R$ e dd/mm/aaaa | ✅ |
| IV. Segurança | rota sob `RequireAuth`; nenhum dado sensível novo; ids no endereço são só da própria conta (a API valida) | ✅ |
| V. Simplicidade | sem endpoint novo; sem dependência nova; sem virtualização de lista; cálculo financeiro definitivo continua no backend (prévias só exibem) | ✅ |

Sem violações — Complexity Tracking vazio.

**Re-check pós-design**: ✅ — as prévias de `preview.ts` replicam regras só para mostrar antes de
salvar; os valores gravados e os totais vêm sempre da API.

## Project Structure

### Documentation (this feature)

```text
specs/007-frontend-expenses/
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
├── app/router.tsx                       # /despesas → ExpensesPage (lazy)
├── features/
│   ├── expenses/
│   │   ├── api.ts  hooks.ts  schemas.ts  preview.ts  use-expenses-url.ts
│   │   ├── components/
│   │   │   ├── month-view.tsx
│   │   │   ├── installment-row.tsx
│   │   │   ├── all-expenses-view.tsx
│   │   │   ├── expense-form-dialog.tsx
│   │   │   ├── expense-detail-dialog.tsx
│   │   │   ├── amortize-dialog.tsx
│   │   │   ├── pay-on-date-dialog.tsx
│   │   │   └── delete-expense-dialog.tsx
│   │   └── pages/expenses-page.tsx
│   └── people/
│       ├── api.ts
│       └── hooks.ts
├── lib/
│   ├── date.ts                          # novo (R§10)
│   └── query-keys.ts                    # + installments, expenses, expense, people
├── test/expenses-store.ts               # novo (R§11)
└── types/api.ts                         # + despesas, parcelas, pessoas
```

**Structure Decision**: segue a constitution v1.2.0 e o padrão da 006; pessoas ganham uma feature
própria desde já, para a tela de Pessoas crescer a partir dela.

## Complexity Tracking

Nenhuma violação a justificar.
