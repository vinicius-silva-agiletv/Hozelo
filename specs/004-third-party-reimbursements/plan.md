# Implementation Plan: Reembolsos de Terceiros

**Branch**: `004-third-party-reimbursements` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-third-party-reimbursements/spec.md`

## Summary

Cada pessoa (esposa, sogro) ganha uma conta corrente com a família. As cobranças vêm de três
origens:

- despesas marcadas como da pessoa (integral ou com percentual);
- contas fixas marcadas como da pessoa;
- cobranças avulsas.

Os pagamentos podem ser parciais e podem escolher as cobranças que quitam. O que não é pago passa
para o mês seguinte e o que é pago a mais vira crédito. Há um extrato por mês e um resumo por
compra, e os reembolsos entram como entradas no resumo do mês da família, com o saldo devedor
como pendência a receber.

Só pessoas, cobranças avulsas e pagamentos são gravados. As cobranças de despesas e contas fixas
são calculadas, então acompanham qualquer mudança na despesa ou na conta fixa. As regras ficam em
três calculadores puros no Domain: `ChargeCalculator`, `PaymentAllocator` e
`PersonStatementCalculator`. Detalhes em [research.md](research.md).

## Technical Context

**Language/Version**: C# 14 / .NET 10, nullable habilitado

**Primary Dependencies**: as mesmas das features anteriores; nenhum pacote novo

**Storage**: PostgreSQL 17; migrations 10–13 (4 tabelas novas + colunas de marcação em `expenses` e
`recurring_entries`)

**Testing**: xUnit, Moq, Bogus, Shouldly, FakeTimeProvider, WebApplicationFactory + Testcontainers

**Target Platform**: servidor Linux/Windows (dev local no Windows)

**Project Type**: web-service (REST API)

**Performance Goals**: extrato, resumo da pessoa e resumo do mês em menos de 500 ms localmente
(poucas pessoas, centenas de cobranças)

**Constraints**: centavos exatos (soma das cobranças de uma despesa = parte da pessoa); saldos sempre
recalculados; "hoje" via `ICalendar`; contratos das features 002/003 só ganham campos opcionais

**Scale/Scope**: ~13 endpoints novos, 5 user stories

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação | Status |
|---|---|---|
| I. DDD e camadas | Entidades e calculadores no Domain; use cases e validadores na Application; EF/migrations na Infrastructure; controllers finos | ✅ |
| II. Clean Code e idioma | Código em inglês; mensagens novas no resx pt-BR | ✅ |
| III. Testes obrigatórios | Domain.Tests (3 calculadores + ajuste do BalanceCalculator), Validators, UseCases e WebApi | ✅ |
| IV. Segurança e dados financeiros | Bearer em tudo; filtro por dono (pessoa do mesmo usuário); `numeric(12,2)`; datas `date` | ✅ |
| V. Simplicidade | Cobranças calculadas (sem sincronização); uma pessoa por despesa em duas colunas; percentual inteiro | ✅ |
| Stack | FluentMigrator, EF Core, FluentValidation, rotas minúsculas no plural (`/people`) | ✅ |
| Novas dependências | Nenhuma | ✅ |

**Re-check pós-design**: ✅ sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/004-third-party-reimbursements/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code

```text
backend/
├── src/Backend/
│   ├── Hozelo.Api/Controllers/          # PeopleController (pessoas, cobranças, pagamentos, extrato, resumo)
│   ├── Hozelo.Application/
│   │   ├── UseCases/Person/{Register,Update,Delete,GetAll}/
│   │   ├── UseCases/Person/Charges/      # cobranças avulsas
│   │   ├── UseCases/Person/Payments/     # pagamentos com cobranças escolhidas
│   │   ├── UseCases/Person/Statement/    # extrato do mês
│   │   ├── UseCases/Person/Summary/      # resumo por origem
│   │   ├── UseCases/Person/PersonLedgerLoader.cs  # monta cobranças + pagamentos de uma pessoa
│   │   ├── UseCases/Expense/ e Recurrence/        # marcação (personId, personPercent)
│   │   └── UseCases/Summary/GetMonthly/           # reembolsos no resumo da família
│   ├── Hozelo.Domain/
│   │   ├── Entities/                     # Person, PersonCharge, PersonPayment, PersonPaymentTarget;
│   │   │                                 # Expense/RecurringEntry.PersonId e PersonPercent
│   │   ├── Calculations/                 # ChargeCalculator, PaymentAllocator, PersonStatementCalculator;
│   │   │                                 # LedgerEntry.PendingExempt; BalanceCalculator.extraPending
│   │   └── Repositories/Person/*
│   └── Hozelo.Infrastructure/            # configurações, repositórios, Version0000010..13
├── src/Shared/                           # requests/responses novos e campos novos; mensagens
└── tests/                                # Domain, Validators, UseCases, WebApi
```

**Structure Decision**: mesma solution; pastas novas nos projetos existentes.

## Ordem de implementação (insumo para /speckit-tasks)

1. **Rebase**: depois do merge da 003, reposicionar a branch sobre a `main`
   (`git rebase --onto main 003-incomes-monthly-balance`).
2. **Fundação**: mensagens, enums (`ChargeOriginType`, `ChargeStatus`, `LedgerSource.Reimbursement`).
3. **US1 Pessoas (P1)**: migration 10, CRUD, listagem (saldos zerados nesta etapa).
4. **US2 Marcação (P1)**: migration 11, campos em despesas e contas fixas, `ChargeCalculator` com
   testes, carregador do razão da pessoa.
5. **US3 Cobranças avulsas (P2)**: migration 12, CRUD.
6. **US4 Pagamentos, extrato e resumo (P1)**: migration 13, `PaymentAllocator` e
   `PersonStatementCalculator` com testes, pagamentos com cobranças escolhidas, extrato, resumo por
   origem, saldos na listagem de pessoas.
7. **US5 Resumo da família (P2)**: `PendingExempt` e `extraPending` no `BalanceCalculator`,
   reembolsos no `GetMonthlySummaryUseCase`, testes de SC-007.
8. **Acabamento**: `Hozelo.Api.http`, Swagger, quickstart contra o PostgreSQL local.

## Complexity Tracking

Não se aplica: nenhuma violação da constitution.
