# Implementation Plan: Despesas e Categorias

**Branch**: `002-expenses-categories` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-expenses-categories/spec.md`

## Summary

CRUD de categorias e de despesas parceladas ou à vista, com cronograma de parcelas mensais
gerado pelo sistema, pagamento por parcela, amortização com desconto e visão mensal de
qualquer mês. A despesa é dividida em `Expense` (o que a família informa) e
`ExpenseInstallment` (uma linha por parcela, com o pagamento efetivo). Todos os totais são
calculados a partir das parcelas, nunca guardados. A regra de dinheiro (divisão em centavos,
última parcela com a sobra, distribuição da amortização pelo maior resto, calendário com dias
29–31) fica em um calculador puro no Domain, com testes próprios. Detalhes em
[research.md](research.md).

## Technical Context

**Language/Version**: C# 14 / .NET 10 (`net10.0`), nullable habilitado

**Primary Dependencies**: as mesmas da feature 001 (ASP.NET Core, EF Core + Npgsql,
FluentMigrator, FluentValidation). Nenhum pacote novo em produção.

**Storage**: PostgreSQL 17; 3 tabelas novas (`categories`, `expenses`,
`expense_installments`), migrations 3–5

**Testing**: xUnit, Moq, Bogus, Shouldly, FakeTimeProvider, WebApplicationFactory +
Testcontainers; novo projeto `Domain.Tests`

**Target Platform**: servidor Linux/Windows (desenvolvimento local no Windows)

**Project Type**: web-service (REST API); frontend fora de escopo

**Performance Goals**: uso familiar; listas e visão mensal em menos de 500 ms localmente com
centenas de despesas e milhares de parcelas

**Constraints**: dinheiro em `decimal`/`numeric(12,2)` com cálculo em centavos; datas de
calendário em `date` com "hoje" no fuso `America/Sao_Paulo` (configurável); mensagens pt-BR;
dados filtrados pelo usuário autenticado

**Scale/Scope**: 1 conta, 13 endpoints, 3 tabelas, 5 user stories

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação | Status |
|---|---|---|
| I. DDD e camadas | Entidades, enum `AmountType`, `InstallmentCalculator` e interfaces de repositório/`ICalendar` no Domain; use cases, validadores e cálculo de resumo na Application; EF, migrations e `Calendar` na Infrastructure; controllers finos | ✅ |
| II. Clean Code e idioma | Código e banco em inglês; mensagens novas em `ResourceMessagesException.resx` | ✅ |
| III. Testes obrigatórios | Domain.Tests (cálculo), Validators.Tests, UseCases.Tests, WebApi.Tests para todos os endpoints | ✅ |
| IV. Segurança e dados financeiros | `[AuthenticatedUser]` em todos os endpoints; filtro por dono; `decimal`/`numeric`, sem `double`; `created_on` em UTC e datas de calendário como `date`; validação antes de persistir; erros padronizados | ✅ |
| V. Simplicidade | Totais calculados em memória (sem cache/views); ids `bigint` expostos sem Hashids; sem recorrência, receitas ou contas bancárias | ✅ |
| Stack | FluentMigrator para esquema; EF Core para dados; rotas minúsculas no plural (`/categories`, `/expenses`, `/installments`) | ✅ |
| Novas dependências justificadas | Nenhum pacote novo; só o projeto de testes `Domain.Tests` (research §14) | ✅ |

**Re-check pós-design**: ✅ nenhuma violação. Observação sobre o princípio IV ("datas em UTC"):
vencimentos e datas de pagamento são datas de calendário sem horário (`date`), não instantes;
instantes continuam em UTC. Não é violação, e está registrado em research §2.

## Project Structure

### Documentation (this feature)

```text
specs/002-expenses-categories/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # decisões técnicas
├── data-model.md        # entidades, tabelas, validações, migrations
├── quickstart.md        # roteiro de validação
├── contracts/
│   └── api.md           # endpoints, requests, responses, erros
├── checklists/
│   └── requirements.md
└── tasks.md             # gerado por /speckit-tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── Backend/
│   │   ├── Hozelo.Api/
│   │   │   └── Controllers/        # CategoriesController, ExpensesController, InstallmentsController
│   │   ├── Hozelo.Application/
│   │   │   ├── UseCases/Category/{Register,Update,Delete,GetAll}/
│   │   │   ├── UseCases/Expense/{Register,Update,Delete,GetById,GetAll}/
│   │   │   ├── UseCases/Expense/{PayInstallment,UndoInstallmentPayment,Amortize}/
│   │   │   ├── UseCases/Installment/GetMonthly/
│   │   │   ├── Summaries/          # ExpenseSummary (valores calculados) + mapeamento p/ responses
│   │   │   └── DependencyInjectionExtension.cs
│   │   ├── Hozelo.Domain/
│   │   │   ├── Entities/           # Category, Expense, ExpenseInstallment
│   │   │   ├── Enums/              # AmountType
│   │   │   ├── Calculations/       # InstallmentCalculator (cronograma, divisão, amortização)
│   │   │   ├── Repositories/       # Category/*, Expense/*, Installment/*
│   │   │   └── Services/Calendar/  # ICalendar
│   │   └── Hozelo.Infrastructure/
│   │       ├── DataAccess/         # configurações EF + repositórios novos; UnitOfWork trata ux_categories_user_name
│   │       ├── Migrations/Versions/ # Version0000003..5
│   │       ├── Services/Calendar/  # Calendar (TimeProvider + fuso), CalendarSettings
│   │       └── DependencyInjectionExtension.cs
│   └── Shared/
│       ├── Hozelo.Communication/
│       │   ├── Enums/              # AmountType, ExpenseStatus (texto no JSON)
│       │   ├── Requests/           # Category, RegisterExpense, UpdateExpense, PayInstallment, AmortizeExpense
│       │   └── Responses/          # Category(ies), Expense, ShortExpense, Expenses, MonthlyInstallments
│       └── Hozelo.Exception/
│           ├── ExceptionsBase/     # + NotFoundException (404), ConflictException (409)
│           └── ResourceMessagesException.resx  # + mensagens novas
└── tests/
    ├── CommonTestUtilities/        # builders de requests/entidades, repositórios fake, CalendarBuilder
    ├── Domain.Tests/               # NOVO: InstallmentCalculator, regras de Expense
    ├── Validators.Tests/           # Category, Expense, Amortize
    ├── UseCases.Tests/             # use cases de categoria, despesa, pagamento, amortização, visão mensal
    └── WebApi.Tests/               # endpoints + reset das tabelas novas
```

**Structure Decision**: mesma solution em camadas; adiciona pastas nos projetos existentes e
um projeto de testes (`Domain.Tests`) incluído em `Hozelo.slnx`. O `JsonStringEnumConverter`
é registrado no `Program.cs` para enums como texto.

## Ordem de implementação (insumo para /speckit-tasks)

1. **Fundação**: `NotFoundException`/`ConflictException` + mensagens; `ICalendar` e
   implementação com fuso; `JsonStringEnumConverter`; projeto `Domain.Tests`; reset das tabelas
   novas na factory de testes.
2. **US1 Categorias (P1)**: migration 3, entidade, repositório, validator, 4 use cases,
   `CategoriesController`, testes.
3. **US2 Registrar despesa (P1)**: migrations 4 e 5, entidades, `InstallmentCalculator`
   (cronograma e divisão) com testes, `ExpenseSummary`, validator, use case de registro,
   `GET /expenses/{id}`, testes.
4. **US3 Acompanhar e pagar (P1)**: listar com filtros e totais, pagar/desfazer parcela, visão
   mensal (consulta research §12), testes.
5. **US4 Amortizar (P2)**: distribuição pelo maior resto no calculador, validator, use case,
   endpoint, testes (inclui a visão mensal com `paidInAdvance`).
6. **US5 Editar e remover (P2)**: use case de edição com as regras de recálculo (research §11),
   remoção, testes.
7. **Acabamento**: `Hozelo.Api.http` com os cenários, roteiro do [quickstart.md](quickstart.md).

## Complexity Tracking

Não se aplica: nenhuma violação da constitution.
