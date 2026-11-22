# Implementation Plan: Telas de Receitas e Contas Fixas

**Branch**: `008-frontend-incomes-fixed-bills` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/008-frontend-incomes-fixed-bills/spec.md`

## Summary

As rotas `/receitas` e `/contas-fixas` viram telas reais organizadas por mês. Receitas mostra as
avulsas, as ocorrências das recorrentes e os reembolsos (só leitura) a partir do resumo mensal da
API, com previsto, recebido e a receber, receber/desfazer (inclusive com outro valor) e cadastro em
dois modos (avulsa ou todo mês). Contas fixas mostra as recorrências de despesa do mês com valor,
dia, situação (em aberto, paga, pulada, ajustada) e totais, cadastro com divisão por pessoa e seção
de encerradas. Os ajustes de recorrência (valor do mês, pular, desfazer, mudar valor daqui para
frente, encerrar/reabrir, editar, remover) são componentes compartilhados pelas duas telas. Só
frontend: consome os endpoints existentes das features 003 e 004.

## Technical Context

**Language/Version**: TypeScript 6, React 19
**Primary Dependencies**: Vite 8, Tailwind 4, shadcn/ui (Radix), React Router 8, TanStack Query 5,
React Hook Form + Zod 4, Sonner — nenhuma dependência nova (R§10)
**Storage**: N/A (dados da API; navegação no endereço, R§3)
**Testing**: Vitest 5 + Testing Library + jsdom; `financeStore` em memória (R§9)
**Target Platform**: navegadores modernos, celular (≥ 360 px) e computador
**Project Type**: web (frontend React consumindo a API .NET existente)
**Performance Goals**: totais atualizados < 1 s após a resposta (SC-002); JS inicial ~337 kB
**Constraints**: totais da API (SC-004); mensagens da API como vieram; pt-BR; sem rolagem
horizontal em 360 px; poucas dezenas de contas fixas por família (um detalhe por conta, em cache)
**Scale/Scope**: 2 páginas, ~15 componentes (9 compartilhados de recorrência), 3 movidos para
`components/shared`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.2.0.

| Princípio | Verificação | Status |
|---|---|---|
| I. Arquitetura / organização por feature | `features/incomes`, `features/fixed-bills`, `features/recurrences` (compartilhado pelas duas telas), `features/summary`; componentes usados por 3 telas sobem para `components/shared`; tipos em `types/api.ts` | ✅ |
| II. Testes | derivações (`occurrence.ts`), schemas e fluxos de cada história com `financeStore`; lint e build | ✅ |
| III. Validação e mensagens | Zod com as regras da API; mensagens da API como vieram; textos pt-BR, R$, dd/mm/aaaa e meses por extenso | ✅ |
| IV. Segurança | rotas sob `RequireAuth`; ids no endereço validados pela API; nenhum dado sensível novo | ✅ |
| V. Simplicidade | sem endpoint novo; sem dependência nova; totais de contas fixas somados de valores da API (sem regra financeira própria); reuso dos componentes da 007 | ✅ |

Sem violações — Complexity Tracking vazio.

**Re-check pós-design**: ✅ — o "valor normal" e o estado da ocorrência são só leitura dos dados da
API (histórico e meses); nenhum valor é gravado a partir de cálculo da tela.

## Project Structure

### Documentation (this feature)

```text
specs/008-frontend-incomes-fixed-bills/
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
├── app/router.tsx                         # /receitas e /contas-fixas (lazy)
├── components/shared/
│   ├── option-group.tsx                   # movido de features/expenses
│   ├── payment-toggle.tsx                 # movido e generalizado (onToggle)
│   └── person-split-fields.tsx            # extraído do formulário de despesa
├── features/
│   ├── summary/{api.ts, hooks.ts}
│   ├── recurrences/
│   │   ├── api.ts  hooks.ts  schemas.ts  occurrence.ts
│   │   └── components/
│   │       ├── recurrence-form-dialog.tsx
│   │       ├── recurrence-detail-dialog.tsx
│   │       ├── occurrence-menu.tsx
│   │       ├── adjust-month-dialog.tsx
│   │       ├── settle-dialogs.tsx          # outra data / outro valor
│   │       ├── change-amount-dialog.tsx
│   │       ├── end-recurrence-dialog.tsx
│   │       └── delete-recurrence-dialog.tsx
│   ├── incomes/
│   │   ├── api.ts  hooks.ts  schemas.ts
│   │   ├── components/{income-month-list.tsx, income-form-dialog.tsx, income-detail-dialog.tsx}
│   │   └── pages/incomes-page.tsx
│   └── fixed-bills/
│       ├── components/{fixed-bill-month-list.tsx, ended-fixed-bills.tsx}
│       └── pages/fixed-bills-page.tsx
├── lib/
│   ├── use-month-url.ts                   # generalizado da 007
│   └── query-keys.ts                      # + summary, incomes, recurrences
├── test/finance-store.ts                  # novo (R§9)
└── types/api.ts                           # + receitas, recorrências, resumo
```

**Structure Decision**: recorrências ganham feature própria porque servem às duas telas;
componentes que passam a servir a três telas (despesas, receitas, contas fixas) sobem para
`components/shared`, conforme a constitution v1.2.0.

## Complexity Tracking

Nenhuma violação a justificar.
