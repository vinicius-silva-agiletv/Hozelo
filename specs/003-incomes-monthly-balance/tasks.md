---

description: "Task list for feature 003-incomes-monthly-balance (Receitas e Saldo Mensal)"
---

# Tasks: Receitas e Saldo Mensal

**Input**: Design documents from `/specs/003-incomes-monthly-balance/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: obrigatórios pela constitution (Princípio III): validators, use cases, integração de
cada endpoint e `Domain.Tests` para os calculadores. Em cada história, escreva os testes antes da
implementação e confirme que falham.

**Organization**: tarefas por história de usuário. A US4 (P2) vem antes das P1 porque receitas
dependem de categorias de receita (plan.md, Ordem de implementação).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história de usuário (US1..US5)

## Path Conventions

- `API/` = `backend/src/Backend/Hozelo.Api/`
- `APP/` = `backend/src/Backend/Hozelo.Application/`
- `DOM/` = `backend/src/Backend/Hozelo.Domain/`
- `INF/` = `backend/src/Backend/Hozelo.Infrastructure/`
- `COM/` = `backend/src/Shared/Hozelo.Communication/`
- `EXC/` = `backend/src/Shared/Hozelo.Exception/`
- `TST/` = `backend/tests/`

Mensagens, status e JSON: [contracts/api.md](contracts/api.md). Restrições de campos e mensagens:
[data-model.md](data-model.md). Decisões: [research.md](research.md) (R§n). Todos os controllers
usam `[AuthenticatedUser]`; todos os repositórios filtram pelo usuário autenticado.

---

## Phase 1: Setup

- [X] T001 Conferir que a branch parte da `main` com a feature 002 e que `dotnet test` em `backend/` passa (187 testes) antes de começar

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T002 Adicionar em `EXC/ResourceMessagesException.resx` e `EXC/ResourceMessagesException.Designer.cs` todas as mensagens novas da tabela "Validações e mensagens novas" de data-model.md, mais `CATEGORY_HAS_ENTRIES` e as mensagens de tipo de categoria
- [X] T003 [P] Criar `DOM/Enums/CategoryType.cs` e `DOM/Enums/EntryKind.cs` (Expense = 1, Income = 2) e os equivalentes em `COM/Enums/` (mais `COM/Enums/LedgerSource.cs`: Installment, Income, Recurrence)
- [X] T004 [P] Criar `DOM/Calculations/YearMonth.cs` (parse/format "yyyy-MM", primeiro dia do mês, comparação, `AddMonths`) e testes em `TST/Domain.Tests/Calculations/YearMonthTest.cs`
- [X] T005 Adicionar `GetByRange(userId, start, end, categoryId?)` em `DOM/Repositories/Installment/IInstallmentReadOnlyRepository.cs` e `INF/DataAccess/Repositories/InstallmentRepository.cs` com a condição da 002 para intervalos; `GetByMonth` passa a delegar (R§9); manter os testes da 002 verdes
- [X] T006 [P] Atualizar `ResetDatabaseAsync` em `TST/WebApi.Tests/HozeloWebApplicationFactory.cs` se necessário (o `TRUNCATE users ... CASCADE` deve alcançar as tabelas novas) e confirmar no primeiro teste de integração

**Checkpoint**: build verde, 187 testes da 002 passando.

---

## Phase 3: User Story 4 - Categorias separadas por tipo (Priority: P2, pré-requisito)

**Goal**: categorias de despesa e de receita, nome único por tipo.

**Independent Test**: criar categorias dos dois tipos, filtrar, conferir unicidade por tipo e
recusa de despesa com categoria de receita (US4-1..4).

### Tests for User Story 4

- [X] T007 [P] [US4] Atualizar `TST/Validators.Tests/Category/CategoryValidatorTest.cs` para tipo inválido e tipo opcional
- [X] T008 [P] [US4] Atualizar/estender `TST/UseCases.Tests/Category/CategoryUseCasesTest.cs`: unicidade por tipo, PUT com tipo diferente → 400, `entriesCount`, remoção com lançamentos → 409 `CATEGORY_HAS_ENTRIES`
- [X] T009 [P] [US4] Estender `TST/WebApi.Tests/Category/CategoriesTest.cs`: `?type=`, mesmo nome em tipos diferentes, categorias antigas como Expense, `entriesCount`; e em `TST/WebApi.Tests/Expense/RegisterExpenseTest.cs` despesa com categoria de receita → 400

### Implementation for User Story 4

- [X] T010 [US4] Criar `INF/Migrations/Versions/Version0000006.cs` (`categories.type` com default 1, check, troca de `ux_categories_user_name` por `ux_categories_user_type_name`; data-model.md `Category.Type`) e a constante em `INF/Migrations/DatabaseVersions.cs`
- [X] T011 [US4] Adicionar `Type` em `DOM/Entities/Category.cs` e `INF/DataAccess/Configurations/CategoryConfiguration.cs`; `ExistsWithName` e `GetAll` por tipo e contagem de lançamentos em `DOM/Repositories/Category/ICategoryReadOnlyRepository.cs` e `INF/DataAccess/Repositories/CategoryRepository.cs`; tratar o novo índice no `INF/DataAccess/UnitOfWork.cs`
- [X] T012 [US4] Atualizar `COM/Requests/RequestCategoryJson.cs` (`Type` opcional) e `COM/Responses/ResponseCategoryJson.cs` (`Type`, `EntriesCount` no lugar de `ExpensesCount`)
- [X] T013 [US4] Atualizar use cases em `APP/UseCases/Category/` (tipo no registro, imutável no update, filtro no GetAll, `CATEGORY_HAS_ENTRIES` no delete) e `API/Controllers/CategoriesController.cs` (`?type=`)
- [X] T014 [US4] Validar tipo da categoria em `APP/UseCases/Expense/Register/RegisterExpenseUseCase.cs` e `APP/UseCases/Expense/Update/UpdateExpenseUseCase.cs` ("A categoria informada não é de despesa.")

**Checkpoint**: 002 continua funcionando com categorias de despesa.

---

## Phase 4: User Story 1 - Receitas avulsas (Priority: P1) 🎯 MVP

**Goal**: registrar, listar, editar, remover e confirmar recebimento de receitas avulsas.

**Independent Test**: CRUD + recebimento (US1-1..4, US3-7 para avulsas).

### Tests for User Story 1

- [X] T015 [P] [US1] Criar `TST/CommonTestUtilities/Requests/RequestIncomeJsonBuilder.cs`, `TST/CommonTestUtilities/Entities/IncomeBuilder.cs` e `TST/CommonTestUtilities/Repositories/IncomeRepositoryBuilder.cs`
- [X] T016 [P] [US1] Testes do validador em `TST/Validators.Tests/Income/IncomeValidatorTest.cs` (uma regra por campo de data-model.md, Income; vários erros juntos)
- [X] T017 [P] [US1] Testes de use case em `TST/UseCases.Tests/Income/IncomeUseCasesTest.cs`: registro (já recebida ou prevista), categoria de despesa → 400, update, delete, NotFound, receber com data padrão/futura, desfazer idempotente
- [X] T018 [P] [US1] Testes de integração em `TST/WebApi.Tests/Income/IncomesTest.cs` (201/400/404/204, filtros `categoryId`/`year`/`month`, recebimento)

### Implementation for User Story 1

- [X] T019 [US1] Criar `INF/Migrations/Versions/Version0000007.cs` com `incomes` (data-model.md `Income.UserId`, `Income.CategoryId`, `Income.Name`, `Income.Amount`, `Income.ExpectedDate`, `Income.ReceivedOn`, `Income.Notes`)
- [X] T020 [P] [US1] Criar `DOM/Entities/Income.cs` (`IsReceived`, `Receive(date)`, `UndoReceipt()`), `DOM/Repositories/Income/IIncomeReadOnlyRepository.cs`, `IIncomeWriteOnlyRepository.cs`, `IIncomeUpdateOnlyRepository.cs`
- [X] T021 [US1] Criar `INF/DataAccess/Configurations/IncomeConfiguration.cs` e `INF/DataAccess/Repositories/IncomeRepository.cs`; registrar em `INF/DependencyInjectionExtension.cs`
- [X] T022 [P] [US1] Criar `COM/Requests/RequestIncomeJson.cs`, `RequestUpdateIncomeJson.cs`, `RequestReceiveIncomeJson.cs` e `COM/Responses/ResponseIncomeJson.cs`, `ResponseIncomesJson.cs`
- [X] T023 [US1] Criar `APP/UseCases/Income/IncomeValidator.cs` (data-model.md `Income.Name`, `Income.Amount`, `Income.ExpectedDate`, `Income.ReceivedOn`, `Income.Notes`) e os use cases `Register`, `Update`, `Delete`, `GetById`, `GetAll`, `Receive`, `UndoReceipt` em `APP/UseCases/Income/`; registrar em `APP/DependencyInjectionExtension.cs`
- [X] T024 [US1] Criar `API/Controllers/IncomesController.cs` conforme contracts/api.md

**Checkpoint**: receitas avulsas funcionando.

---

## Phase 5: User Story 2 - Receitas recorrentes (Priority: P1)

**Goal**: salário cadastrado uma vez, com ajuste, pulo, valor dali em diante, encerrar e confirmar.

**Independent Test**: recorrência de receita consultada em vários meses (US2-1..8, US3-8).

### Tests for User Story 2

- [X] T025 [P] [US2] Testes do calculador em `TST/Domain.Tests/Calculations/RecurrenceCalculatorTest.cs`: antes do início, depois do fim, sem fim, dia 31 em fevereiro/bissexto, histórico de valores (várias mudanças), ajuste prevalece sobre histórico, pulo, situação (R§4)
- [X] T026 [P] [US2] Testes das regras da entidade em `TST/Domain.Tests/Entities/RecurringEntryTest.cs`: valor dali em diante congela meses liquidados sem ajuste e mantém mudanças posteriores, desfazer ajuste mantém liquidação e apaga registro vazio, encerrar/reabrir (R§5)
- [X] T027 [P] [US2] Criar builders `TST/CommonTestUtilities/Requests/RequestRecurrenceJsonBuilder.cs`, `TST/CommonTestUtilities/Entities/RecurringEntryBuilder.cs`, `TST/CommonTestUtilities/Repositories/RecurrenceRepositoryBuilder.cs`
- [X] T028 [P] [US2] Testes dos validadores em `TST/Validators.Tests/Recurrence/` (registro, update, valor dali em diante, encerrar, ajuste de mês): cada regra de data-model.md para RecurringEntry, RecurringEntryAmount e RecurringEntryMonth
- [X] T029 [P] [US2] Testes de use case em `TST/UseCases.Tests/Recurrence/RecurrenceUseCasesTest.cs`: todas as regras de R§5 com mensagens (fora do período, pular liquidado, confirmar pulado, encerrar antes de liquidado, categoria do tipo errado, NotFound)
- [X] T030 [P] [US2] Testes de integração em `TST/WebApi.Tests/Recurrence/RecurrencesTest.cs`: CRUD, `/amount`, `/end`, `/months/{y}/{m}`, `/settlement`, detalhe com `amounts` e `months`, `currentAmount` e `isActive`

### Implementation for User Story 2

- [X] T031 [US2] Criar `INF/Migrations/Versions/Version0000008.cs` com `recurring_entries`, `recurring_entry_amounts` e `recurring_entry_months` (data-model.md `RecurringEntry.UserId`, `RecurringEntry.CategoryId`, `RecurringEntry.Kind`, `RecurringEntry.Name`, `RecurringEntry.DayOfMonth`, `RecurringEntry.StartMonth`, `RecurringEntry.EndMonth`, `RecurringEntry.Notes`, `RecurringEntryAmount.EffectiveMonth`, `RecurringEntryAmount.Amount`, `RecurringEntryMonth.Month`, `RecurringEntryMonth.Amount`, `RecurringEntryMonth.Skipped`, `RecurringEntryMonth.SettledOn`)
- [X] T032 [P] [US2] Criar entidades `DOM/Entities/RecurringEntry.cs` (métodos `ChangeAmountFrom`, `AdjustMonth`, `SkipMonth`, `UndoMonthAdjustment`, `SettleMonth`, `UndoMonthSettlement`, `End`, `Reopen`, `IsWithinPeriod`), `RecurringEntryAmount.cs`, `RecurringEntryMonth.cs`
- [X] T033 [US2] Criar `DOM/Calculations/RecurrenceCalculator.cs` (`Occurrence? For(entry, month)` e `Occurrences(entry, from, to)`; reusa `InstallmentCalculator.DueDate`)
- [X] T034 [P] [US2] Criar `DOM/Repositories/Recurrence/IRecurrenceReadOnlyRepository.cs`, `IRecurrenceWriteOnlyRepository.cs`, `IRecurrenceUpdateOnlyRepository.cs` (com `Amounts` e `Months`)
- [X] T035 [US2] Criar configurações EF em `INF/DataAccess/Configurations/` e `INF/DataAccess/Repositories/RecurrenceRepository.cs`; registrar em DI
- [X] T036 [P] [US2] Criar requests/responses em `COM/` conforme contracts/api.md (Recurrence, ChangeAmount, End, AdjustMonth, SettleMonth)
- [X] T037 [US2] Criar validadores e use cases em `APP/UseCases/Recurrence/` (Register, Update, Delete, GetById, GetAll, ChangeAmount, End, Reopen, AdjustMonth, UndoMonthAdjustment, SettleMonth, UndoMonthSettlement), com categoria do tipo do `kind`; registrar em DI
- [X] T038 [US2] Criar `API/Controllers/RecurrencesController.cs` conforme contracts/api.md

**Checkpoint**: recorrências (receita e despesa) funcionando via API.

---

## Phase 6: User Story 3 - Saldo do mês (Priority: P1)

**Goal**: resumo do mês com entradas, saídas, previsto, realizado; depois saldo inicial,
acumulado e pendências.

**Independent Test**: US3-1..15 com PostgreSQL real e "hoje" controlado.

### Tests for User Story 3

- [X] T039 [P] [US3] Testes do calculador em `TST/Domain.Tests/Calculations/BalanceCalculatorTest.cs`: previsto/realizado do mês, saldo negativo, filtro, mês do saldo inicial parcial (só itens com data ≥ referência), meses antes do saldo inicial sem acumulado, passado = realizado e atual/futuro = previsto, pendências só no mês atual, liquidar pendência não muda o acumulado, `previousBalance(M+1) = endBalance(M)` em sequência longa (R§8)
- [X] T040 [P] [US3] Testes de use case em `TST/UseCases.Tests/Summary/GetMonthlySummaryUseCaseTest.cs`: montagem dos lançamentos das 3 fontes (parcela antecipada no mês do pagamento, valor previsto = pago quando paga), padrão mês atual, mês inválido, sem saldo inicial (`openingBalanceMissing`), filtro sem acumulado
- [X] T041 [P] [US3] Testes do saldo inicial em `TST/Validators.Tests/OpeningBalance/OpeningBalanceValidatorTest.cs` e `TST/UseCases.Tests/OpeningBalance/OpeningBalanceUseCasesTest.cs` (data-model.md `OpeningBalance.Amount`, `OpeningBalance.ReferenceDate`)
- [X] T042 [P] [US3] Testes de integração em `TST/WebApi.Tests/Summary/MonthlySummaryTest.cs`: US3-1..8 e, em `TST/WebApi.Tests/Summary/AccumulatedBalanceTest.cs`, US3-9..15 e SC-008 (encadeamento de vários meses), além de `GET /installments` inalterado

### Implementation for User Story 3

- [X] T043 [US3] Criar `DOM/Calculations/LedgerEntry.cs` e `DOM/Calculations/BalanceCalculator.cs` (`MonthSummary`, `Accumulated`, `Pending`) conforme R§8
- [X] T044 [P] [US3] Criar `COM/Responses/ResponseMonthlySummaryJson.cs` e tipos aninhados (`ResponseLedgerItemJson`, totais, pendências, acumulado) conforme contracts/api.md
- [X] T045 [US3] Criar `APP/UseCases/Summary/GetMonthly/` (busca parcelas via `GetByRange`, receitas avulsas por intervalo, recorrências do usuário; monta `LedgerEntry`; chama `BalanceCalculator`) e `API/Controllers/SummariesController.cs` (`GET /summaries`)
- [X] T046 [US3] Criar `INF/Migrations/Versions/Version0000009.cs` com `opening_balances` (data-model.md `OpeningBalance.UserId`, `OpeningBalance.Amount`, `OpeningBalance.ReferenceDate`), entidade `DOM/Entities/OpeningBalance.cs`, repositório, configuração e DI
- [X] T047 [US3] Criar `APP/UseCases/OpeningBalance/{Get,Set}/` com validador, requests/responses em `COM/` e `API/Controllers/OpeningBalanceController.cs` (`GET`/`PUT /opening-balance`)
- [X] T048 [US3] Ligar saldo inicial, acumulado e pendências ao `GetMonthly` (somente sem filtro de categoria)

**Checkpoint**: resumo completo do mês funcionando.

---

## Phase 7: User Story 5 - Contas fixas recorrentes (Priority: P2)

**Goal**: despesas recorrentes nas saídas, no pago e nas pendências.

**Independent Test**: US5-1..6.

- [X] T049 [P] [US5] Testes de integração em `TST/WebApi.Tests/Recurrence/FixedBillsTest.cs`: conta fixa nas saídas de vários meses, ajuste de um mês, pagar (entra no realizado), paga com atraso continua no mês do vencimento, encerrar, categoria de receita → 400, conta fixa de mês passado não paga nas pendências
- [X] T050 [P] [US5] Testes de use case em `TST/UseCases.Tests/Recurrence/FixedBillsUseCasesTest.cs` (regras de FR-027 para `kind = Expense`)
- [X] T051 [US5] Ajustar o que os testes da US5 revelarem em `APP/UseCases/Recurrence/` e `APP/UseCases/Summary/GetMonthly/` (direção de saída, situação "paga")

**Checkpoint**: todas as histórias funcionam de forma independente.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T052 [P] Adicionar os cenários do quickstart em `API/Hozelo.Api.http`
- [X] T053 [P] Conferir no Swagger os endpoints novos com Bearer e os status de contracts/api.md
- [X] T054 Rodar `dotnet build` (0 warnings) e `dotnet test` em `backend/`
- [X] T055 Executar o roteiro de [quickstart.md](quickstart.md) contra o PostgreSQL local (banco temporário) e registrar o resultado

---

## Dependencies & Execution Order

```text
Setup → Foundational → US4 → US1 ─┐
                           └→ US2 ─┼→ US3 → US5 → Polish
```

- **US4** é pré-requisito de US1 e US2 (categoria de receita).
- **US1** e **US2** podem andar em paralelo após a US4 (arquivos diferentes, exceto
  `APP/DependencyInjectionExtension.cs`, `INF/DependencyInjectionExtension.cs` e
  `INF/Migrations/DatabaseVersions.cs`; as migrations 7 e 8 precisam dessa ordem de número).
- **US3** depende de US1 e US2 (as três fontes do razão mensal).
- **US5** depende de US2 (mesma recorrência) e US3 (pendências e saídas).

### Within Each User Story

Testes primeiro (falhando) → migration → domínio/calculadores → infraestrutura → contratos →
application → controller.

### Parallel Opportunities

- T003, T004, T006 na Foundational.
- Todas as tarefas de teste [P] de cada história juntas; depois entidades, interfaces e contratos.
- US1 e US2 em paralelo após a US4.

---

## Parallel Example: User Story 2

```text
T025 RecurrenceCalculatorTest
T026 RecurringEntryTest
T028 validators de recorrência
T029 RecurrenceUseCasesTest
T030 RecurrencesTest (integração)
```

---

## Implementation Strategy

### MVP

1. Foundational + US4 + US1 + US2 + US3 sem acumulado (T039–T045) → já mostra entradas, saídas e
   saldo do mês.
2. Acumulado (T046–T048).
3. US5 (contas fixas).
4. Polish.

Um commit por fase concluída com testes verdes (Conventional Commits).

---

## Notes

- Nunca editar migrations 1–5; as novas são 6, 7, 8 e 9.
- Dinheiro sempre `decimal`, centavos exatos; "hoje" sempre via `ICalendar`.
- `GET /installments` (002) não pode mudar: manter seus testes intactos.
