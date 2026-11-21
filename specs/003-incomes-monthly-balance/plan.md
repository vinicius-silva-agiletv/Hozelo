# Implementation Plan: Receitas e Saldo Mensal

**Branch**: `003-incomes-monthly-balance` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-incomes-monthly-balance/spec.md`

## Summary

Adiciona entradas de dinheiro e transforma a visão mensal num resumo completo do mês:

- receitas avulsas (`incomes`);
- uma recorrência única para receitas e contas fixas (`recurring_entries`, com histórico de
  valores e registros por mês);
- saldo inicial;
- categorias separadas por tipo;
- novo endpoint `GET /summaries` com entradas, saídas, previsto, realizado, pendências de meses
  anteriores e saldo acumulado.

As ocorrências das recorrências são calculadas, não gravadas. Todo o cálculo do saldo fica em dois
calculadores puros no Domain: `RecurrenceCalculator` e `BalanceCalculator`. Eles são testados à
parte, porque ali está o maior risco da feature. Detalhes em [research.md](research.md).

## Technical Context

**Language/Version**: C# 14 / .NET 10, nullable habilitado

**Primary Dependencies**: as mesmas das features 001/002; nenhum pacote novo

**Storage**: PostgreSQL 17; migrations 6–9 (1 alteração + 5 tabelas novas)

**Testing**: xUnit, Moq, Bogus, Shouldly, FakeTimeProvider, WebApplicationFactory + Testcontainers

**Target Platform**: servidor Linux/Windows (dev local no Windows)

**Project Type**: web-service (REST API)

**Performance Goals**: `GET /summaries` em menos de 500 ms localmente com anos de histórico
(centenas de meses, milhares de parcelas)

**Constraints**: centavos exatos; "hoje" e "mês atual" via `ICalendar` (fuso da família); saldo
acumulado sempre recalculado, nunca armazenado; `GET /installments` da 002 inalterado

**Scale/Scope**: 1 conta, ~22 endpoints novos, 5 user stories

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação | Status |
|---|---|---|
| I. DDD e camadas | Entidades, enums, calculadores e interfaces no Domain; use cases, validadores e montagem do razão mensal na Application; EF/migrations na Infrastructure; controllers finos | ✅ |
| II. Clean Code e idioma | Código e banco em inglês; mensagens novas no resx pt-BR | ✅ |
| III. Testes obrigatórios | Domain.Tests (calculadores), Validators, UseCases e WebApi para todos os endpoints | ✅ |
| IV. Segurança e dados financeiros | `[AuthenticatedUser]` em tudo; filtro por dono; `numeric(12,2)`; datas de calendário `date`, instantes UTC | ✅ |
| V. Simplicidade | Ocorrências calculadas em vez de geradas; uma estrutura de recorrência para os dois tipos; acumulado calculado em memória | ✅ |
| Stack | FluentMigrator, EF Core, FluentValidation, rotas minúsculas | ⚠️ ver nota |
| Novas dependências | Nenhuma | ✅ |

**Nota (rotas)**: `/opening-balance` é singular por ser um recurso único por conta (um saldo
inicial). Não há um conjunto a listar. Registrado em research §6; as demais rotas seguem o plural.

**Mudança de contrato da 002**: `expensesCount` passa a `entriesCount` (research §10). Ainda não
há frontend, então nenhum cliente quebra; os testes da 002 são atualizados.

**Re-check pós-design**: ✅ sem violações; a exceção de rota está justificada acima.

## Project Structure

### Documentation (this feature)

```text
specs/003-incomes-monthly-balance/
├── spec.md
├── plan.md              # este arquivo
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code

```text
backend/
├── src/Backend/
│   ├── Hozelo.Api/Controllers/          # IncomesController, RecurrencesController,
│   │                                    # OpeningBalanceController, SummariesController (+ Categories ajustado)
│   ├── Hozelo.Application/
│   │   ├── UseCases/Income/{Register,Update,Delete,GetById,GetAll,Receive,UndoReceipt}/
│   │   ├── UseCases/Recurrence/{Register,Update,Delete,GetById,GetAll,ChangeAmount,End,Reopen,
│   │   │                        AdjustMonth,UndoMonthAdjustment,SettleMonth,UndoMonthSettlement}/
│   │   ├── UseCases/OpeningBalance/{Get,Set}/
│   │   ├── UseCases/Summary/GetMonthly/  # monta LedgerEntry das 3 fontes e chama BalanceCalculator
│   │   └── UseCases/Category/ e Expense/ # tipo de categoria e entriesCount
│   ├── Hozelo.Domain/
│   │   ├── Entities/                     # Income, RecurringEntry, RecurringEntryAmount,
│   │   │                                 # RecurringEntryMonth, OpeningBalance; Category.Type
│   │   ├── Enums/                        # CategoryType, EntryKind
│   │   ├── Calculations/                 # RecurrenceCalculator, BalanceCalculator, LedgerEntry
│   │   └── Repositories/                 # Income/*, Recurrence/*, OpeningBalance/*; Installment.GetByRange
│   └── Hozelo.Infrastructure/
│       ├── DataAccess/                   # configurações e repositórios novos
│       └── Migrations/Versions/          # Version0000006..9
├── src/Shared/
│   ├── Hozelo.Communication/            # requests/responses novos; enums CategoryType, EntryKind,
│   │                                    # LedgerSource; YearMonth em texto "yyyy-MM"
│   └── Hozelo.Exception/                # mensagens novas
└── tests/
    ├── Domain.Tests/                    # RecurrenceCalculatorTest, BalanceCalculatorTest
    ├── Validators.Tests/                # Income, Recurrence, OpeningBalance, Category (type)
    ├── UseCases.Tests/                  # use cases novos e ajustes
    └── WebApi.Tests/                    # endpoints novos + cenário completo do acumulado
```

**Structure Decision**: mesma solution; só pastas novas nos projetos existentes.

## Ordem de implementação (insumo para /speckit-tasks)

Cada etapa termina com testes verdes e pode ser commitada sozinha.

1. **Fundação**: mensagens novas, enums, `YearMonth` (parse/format "yyyy-MM"),
   `InstallmentRepository.GetByRange`.
2. **US4 Categorias por tipo (P2, mas pré-requisito)**: migration 6, `Category.Type`, filtro
   `type`, unicidade por tipo, `entriesCount`, validação de tipo em despesas. Vem primeiro porque
   receitas dependem de categoria de receita.
3. **US1 Receitas avulsas (P1)**: migration 7, CRUD, recebimento/desfazer.
4. **US2 Recorrências (P1)**: migration 8, `RecurrenceCalculator` com testes, CRUD, valor dali em
   diante (com congelamento), ajustar/pular/desfazer, encerrar/reabrir, confirmar/desfazer.
   O código já é genérico (`kind`), então a **US5 contas fixas** sai junto, faltando só os
   testes de despesa e a validação de categoria.
5. **US3 Saldo do mês (P1)**: `BalanceCalculator` com testes, `GET /summaries` com previsto e
   realizado (sem acumulado).
6. **US3 Acumulado**: migration 9, saldo inicial, acumulado, pendências, mês do saldo inicial
   parcial, regra do mês atual previsto.
7. **US5 Contas fixas (P2)**: testes de ponta a ponta de despesas recorrentes nas saídas, no pago e
   nas pendências.
8. **Acabamento**: `Hozelo.Api.http`, Swagger, quickstart contra o PostgreSQL local.

## Complexity Tracking

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| Rota singular `/opening-balance` | Recurso único por conta | `/opening-balances` sugeriria uma lista que não existe e exigiria id na rota |
