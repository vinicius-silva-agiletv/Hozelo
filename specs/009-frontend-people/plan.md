# Implementation Plan: Tela de Pessoas

**Branch**: `009-frontend-people` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/009-frontend-people/spec.md`

## Summary

A rota `/pessoas` vira a lista de pessoas com quanto cada uma deve até agora e no mês (com crédito
quando pagou a mais), cadastro/renomear/remover e a ação "Pagamento" direto na lista com o valor do
mês sugerido. A nova rota `/pessoas/:id` mostra a pessoa com duas abas: **Extrato do mês** (saldo
anterior, cobranças com situação, pagamentos, saldo final que passa ao mês seguinte) e **Resumo
geral** (cada origem com vencidas, pago e falta; deve até hoje e no total). Pagamentos (com escolha
opcional das cobranças) e cobranças avulsas são registrados, editados e removidos em painéis. O
reembolso em Receitas passa a abrir a pessoa. Só frontend: consome os endpoints da feature 004.

## Technical Context

**Language/Version**: TypeScript 6, React 19
**Primary Dependencies**: Vite 8, Tailwind 4, shadcn/ui (Radix), React Router 8, TanStack Query 5,
React Hook Form + Zod 4, Sonner — nenhuma dependência nova (R§10)
**Storage**: N/A (dados da API; pessoa na rota, aba e mês no endereço, R§3)
**Testing**: Vitest 5 + Testing Library + jsdom; `peopleStore` em memória (R§9)
**Target Platform**: navegadores modernos, celular (≥ 360 px) e computador
**Project Type**: web (frontend React consumindo a API .NET existente)
**Performance Goals**: pagamento em < 20 s a partir da lista (SC-001); JS inicial ~338 kB
**Constraints**: saldos, situações e abatimento só da API (SC-003); mensagens da API como vieram;
pt-BR; sem rolagem horizontal em 360 px; cobrança avulsa sem observação (R§6)
**Scale/Scope**: 2 páginas, ~9 componentes, poucas pessoas por família

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.2.0.

| Princípio | Verificação | Status |
|---|---|---|
| I. Arquitetura / organização por feature | tudo em `features/people` (api, hooks, schemas, componentes, duas páginas); tipos em `types/api.ts`; `formatBalance` em `lib` | ✅ |
| II. Testes | schemas, `formatBalance` e fluxos de cada história com `peopleStore`; lint e build | ✅ |
| III. Validação e mensagens | Zod com as regras da API; mensagens da API como vieram; textos pt-BR | ✅ |
| IV. Segurança | rotas sob `RequireAuth`; id da pessoa na rota validado pela API (404 → volta à lista) | ✅ |
| V. Simplicidade | sem endpoint novo nem dependência nova; nenhuma regra de abatimento na tela; observação da cobrança avulsa omitida em vez de mudar o backend nesta feature | ✅ |

Sem violações — Complexity Tracking vazio.

**Re-check pós-design**: ✅ — o valor sugerido no pagamento é o `currentMonthDue` da API; a lista de
cobranças escolhíveis vem do extrato; nada é calculado pela tela além de formatação.

## Project Structure

### Documentation (this feature)

```text
specs/009-frontend-people/
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
├── app/router.tsx                           # /pessoas e /pessoas/:id (lazy)
├── features/
│   ├── people/
│   │   ├── api.ts  hooks.ts                 # + statement, summary, pessoas, pagamentos, cobranças
│   │   ├── schemas.ts                       # novo
│   │   ├── components/
│   │   │   ├── people-list.tsx
│   │   │   ├── person-form-dialog.tsx
│   │   │   ├── delete-person-dialog.tsx
│   │   │   ├── statement-view.tsx
│   │   │   ├── charge-row.tsx
│   │   │   ├── overview-view.tsx
│   │   │   ├── payment-form-dialog.tsx
│   │   │   ├── charge-form-dialog.tsx
│   │   │   └── delete-entry-dialog.tsx
│   │   └── pages/{people-page.tsx, person-page.tsx}
│   ├── incomes/components/income-month-list.tsx   # reembolso → /pessoas/{id}?mes=
│   ├── expenses/hooks.ts                          # + invalida chaves de pessoas
│   └── recurrences/hooks.ts                       # + invalida chaves de pessoas
├── lib/
│   ├── format.ts                            # + formatBalance
│   └── query-keys.ts                        # + personStatement, personSummary
├── test/people-store.ts                     # novo (R§9)
└── types/api.ts                             # + cobranças, pagamentos, extrato, resumo
```

**Structure Decision**: a feature `people` já existia (seletor de pessoa da 007) e passa a conter a
área completa; as outras features só ganham invalidação de cache e o atalho do reembolso.

## Complexity Tracking

Nenhuma violação a justificar.
