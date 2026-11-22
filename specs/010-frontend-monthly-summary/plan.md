# Implementation Plan: Tela de Resumo do Mês

**Branch**: `010-frontend-monthly-summary` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/010-frontend-monthly-summary/spec.md`

## Summary

A rota `/` vira o Resumo do mês. O destaque principal é o "Saldo no fim do mês" (acumulado desde o
saldo inicial, com o que veio do mês anterior e a indicação de projeção ou realizado); sem
acumulado, o saldo previsto do mês com o motivo e, sem saldo inicial, o atalho para Configurações.
Abaixo, os cartões de previsto e realizado, as pendências de meses anteriores (só no mês atual) e as
abas Entradas e Saídas, com filtro por categoria, link para o detalhe de cada item e a caixa de
pago/recebido (parcelas, contas fixas e receitas). Tudo vem de uma chamada à API; as ações usam os
hooks das features 007 e 008. Só frontend.

## Technical Context

**Language/Version**: TypeScript 6, React 19
**Primary Dependencies**: Vite 8, Tailwind 4, shadcn/ui (Radix), React Router 8, TanStack Query 5,
Sonner — nenhuma dependência nova (R§10)
**Storage**: N/A (dados da API; mês, categoria e aba no endereço, R§8)
**Testing**: Vitest 5 + Testing Library + jsdom; `summaryStore` em memória (R§9)
**Target Platform**: navegadores modernos, celular (≥ 360 px) e computador
**Project Type**: web (frontend React consumindo a API .NET existente)
**Performance Goals**: destaque visível ao abrir (SC-001); JS inicial ~339 kB
**Constraints**: totais, pendências e acumulado só da API (SC-003); mensagens da API como vieram;
pt-BR; sem rolagem horizontal em 360 px
**Scale/Scope**: 1 página, ~6 componentes, dezenas de itens por mês

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.2.0.

| Princípio | Verificação | Status |
|---|---|---|
| I. Arquitetura / organização por feature | tudo em `features/summary` (página, componentes, `ledger.ts`); ações via hooks públicos de `expenses`, `incomes` e `recurrences` | ✅ |
| II. Testes | `ledger.ts` (links, valores, destaque) e fluxos de cada história com `summaryStore`; lint e build | ✅ |
| III. Validação e mensagens | sem formulários novos; mensagens da API como vieram; textos pt-BR | ✅ |
| IV. Segurança | rota sob `RequireAuth`; nenhum dado novo | ✅ |
| V. Simplicidade | uma chamada à API; nenhum cálculo financeiro na tela; sem endpoint nem dependência nova | ✅ |

Sem violações — Complexity Tracking vazio.

**Re-check pós-design**: ✅ — o destaque escolhe entre valores da API (acumulado ou previsto); nada é
somado pela tela.

## Project Structure

### Documentation (this feature)

```text
specs/010-frontend-monthly-summary/
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
├── app/router.tsx                       # / → SummaryPage (lazy)
├── features/summary/
│   ├── api.ts  hooks.ts                 # já existem (008)
│   ├── ledger.ts                        # novo: links, valores, destaque
│   ├── components/
│   │   ├── summary-hero.tsx
│   │   ├── summary-totals.tsx
│   │   ├── pending-section.tsx
│   │   ├── ledger-list.tsx              # LedgerList + LedgerRow
│   │   ├── ledger-toggle.tsx
│   │   └── summary-category-filter.tsx
│   └── pages/summary-page.tsx
└── test/summary-store.ts                # novo (R§9)
```

**Structure Decision**: o resumo já tinha `features/summary` (api/hooks usados por Receitas e Contas
fixas); a página e seus componentes entram ali.

## Complexity Tracking

Nenhuma violação a justificar.
