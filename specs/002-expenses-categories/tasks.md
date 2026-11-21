---

description: "Task list for feature 002-expenses-categories (Despesas e Categorias)"
---

# Tasks: Despesas e Categorias

**Input**: Design documents from `/specs/002-expenses-categories/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: obrigatórios pela constitution (Princípio III): validators, use cases e integração
de cada endpoint, mais `Domain.Tests` para o cálculo de dinheiro. Em cada história, escreva os
testes antes da implementação e confirme que falham.

**Organization**: tarefas agrupadas por história de usuário para implementação e teste
independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história de usuário da tarefa (US1..US5)

## Path Conventions

- `API/` = `backend/src/Backend/Hozelo.Api/`
- `APP/` = `backend/src/Backend/Hozelo.Application/`
- `DOM/` = `backend/src/Backend/Hozelo.Domain/`
- `INF/` = `backend/src/Backend/Hozelo.Infrastructure/`
- `COM/` = `backend/src/Shared/Hozelo.Communication/`
- `EXC/` = `backend/src/Shared/Hozelo.Exception/`
- `TST/` = `backend/tests/`

Mensagens pt-BR, status HTTP e formatos JSON: ver [contracts/api.md](contracts/api.md).
Restrições de campos e mensagens de validação: ver [data-model.md](data-model.md). Decisões:
ver [research.md](research.md) (citado como R§n).

Todos os controllers desta feature usam `[AuthenticatedUser]`; todos os repositórios filtram
pelo usuário autenticado (`ILoggedUser`, R§6).

---

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Criar projeto de testes `TST/Domain.Tests/Domain.Tests.csproj` (xUnit, Shouldly, referência a `Hozelo.Domain` e `CommonTestUtilities`) e incluí-lo em `backend/Hozelo.slnx`, com as mesmas versões de pacotes dos outros projetos de teste
- [X] T002 Registrar `JsonStringEnumConverter` em `AddControllers().AddJsonOptions(...)` em `API/Program.cs` (enums como texto, contracts/api.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: nenhuma história começa antes desta fase.

### Erros e mensagens

- [X] T003 [P] Criar `EXC/ExceptionsBase/NotFoundException.cs` (404, mensagem única) e `EXC/ExceptionsBase/ConflictException.cs` (409, mensagem única) seguindo `HozeloException` (R§13)
- [X] T004 Adicionar em `EXC/ResourceMessagesException.resx` e em `EXC/ResourceMessagesException.Designer.cs` todas as mensagens novas das tabelas de data-model.md (Category, Expense, ExpenseInstallment, pagamento e amortização), com chaves em inglês em MAIÚSCULAS (ex.: `CATEGORY_NAME_EMPTY`, `EXPENSE_NOT_FOUND`, `PAID_ON_IN_FUTURE`)

### Calendário

- [X] T005 [P] Criar `DOM/Services/Calendar/ICalendar.cs` com `DateOnly Today()` (R§2)
- [X] T006 Criar `INF/Services/Calendar/CalendarSettings.cs` (seção `Settings:Calendar`, `TimeZoneId` padrão `America/Sao_Paulo`) e `INF/Services/Calendar/Calendar.cs` (usa `TimeProvider` + `TimeZoneInfo.FindSystemTimeZoneById`), registrar em `INF/DependencyInjectionExtension.cs` e adicionar a seção em `API/appsettings.json`
- [X] T007 [P] Criar `TST/CommonTestUtilities/Services/CalendarBuilder.cs` (mock de `ICalendar` com data fixa)

### Base de testes

- [X] T008 Atualizar `ResetDatabaseAsync` em `TST/WebApi.Tests/HozeloWebApplicationFactory.cs` para truncar `expense_installments`, `expenses` e `categories` (`RESTART IDENTITY CASCADE`) quando existirem (mesmo padrão `to_regclass` da 001), antes de `users`
- [X] T009 [P] Adicionar `DoPut` e `DoDelete` (com token) em `TST/WebApi.Tests/HozeloClassFixture.cs` e um helper que cadastra a conta e devolve o token

**Checkpoint**: build verde, 44 testes da 001 continuam passando.

---

## Phase 3: User Story 1 - Gerenciar categorias (Priority: P1) 🎯 MVP

**Goal**: criar, listar, renomear e remover categorias.

**Independent Test**: CRUD de categorias pela API sem nenhuma despesa (US1-1..6).

### Tests for User Story 1

- [X] T010 [P] [US1] Criar `TST/CommonTestUtilities/Requests/RequestCategoryJsonBuilder.cs` e `TST/CommonTestUtilities/Entities/CategoryBuilder.cs`
- [X] T011 [P] [US1] Testes do validador em `TST/Validators.Tests/Category/CategoryValidatorTest.cs`: sucesso, vazio, só espaços, 50 e 51 caracteres (data-model.md `Category.Name`)
- [X] T012 [P] [US1] Testes de use case em `TST/UseCases.Tests/Category/` (Register, Update, Delete, GetAll): nome repetido ignorando caixa/espaços → Conflict, renomear para o próprio nome com outra caixa permitido, renomear para nome de outra → Conflict, remover com despesas → Conflict, id inexistente → NotFound, lista em ordem alfabética com `expensesCount`
- [X] T013 [P] [US1] Testes de integração em `TST/WebApi.Tests/Category/CategoriesTest.cs`: 201/400/409 no POST, 204/404/409 no PUT, 204/404/409 no DELETE (409 após inserir despesa direto no banco ou depois da US2), GET ordenado, 401 sem token

### Implementation for User Story 1

- [X] T014 [US1] Adicionar `CreateTableCategories = 3` em `INF/Migrations/DatabaseVersions.cs` e criar `INF/Migrations/Versions/Version0000003.cs` com a tabela `categories`, FK `user_id` e índice único `ux_categories_user_name` sobre `(user_id, lower(name))` (data-model.md `Category.UserId`, `Category.Name`)
- [X] T015 [P] [US1] Criar entidade `DOM/Entities/Category.cs` (data-model.md `Category.UserId`, `Category.Name`)
- [X] T016 [P] [US1] Criar `DOM/Repositories/Category/ICategoryReadOnlyRepository.cs` (`GetAll` com contagem de despesas, `GetById`, `ExistsWithName(name, excludingId?)`, `HasExpenses`), `ICategoryWriteOnlyRepository.cs` (`Add`, `Delete`) e `ICategoryUpdateOnlyRepository.cs` (`GetById` rastreado), todos recebendo o `userId`
- [X] T017 [US1] Criar `INF/DataAccess/Configurations/CategoryConfiguration.cs` (colunas snake_case) e `INF/DataAccess/Repositories/CategoryRepository.cs` (comparação de nome com `ToLower()` traduzido para `lower()`), registrar em `INF/DependencyInjectionExtension.cs`
- [X] T018 [US1] Converter violação `23505` de `ux_categories_user_name` em `ConflictException` em `INF/DataAccess/UnitOfWork.cs` (R§8)
- [X] T019 [P] [US1] Criar `COM/Requests/RequestCategoryJson.cs`, `COM/Responses/ResponseCategoryJson.cs` (`id`, `name`, `expensesCount`) e `COM/Responses/ResponseCategoriesJson.cs`
- [X] T020 [US1] Criar `APP/UseCases/Category/CategoryValidator.cs` (data-model.md `Category.Name`; trim antes de validar)
- [X] T021 [US1] Criar use cases em `APP/UseCases/Category/Register/`, `Update/`, `Delete/` e `GetAll/` (interface + implementação cada) com as regras de negócio de data-model.md (Category), e registrar em `APP/DependencyInjectionExtension.cs`
- [X] T022 [US1] Criar `API/Controllers/CategoriesController.cs` com GET, POST (201), PUT `{id}` (204) e DELETE `{id}` (204), `[AuthenticatedUser]` e `ProducesResponseType`

**Checkpoint**: US1 funciona e é testável sozinha.

---

## Phase 4: User Story 2 - Registrar uma despesa (Priority: P1)

**Goal**: registrar despesa à vista ou parcelada; o sistema gera as parcelas e calcula os
valores.

**Independent Test**: registrar despesas (US2-1..6) e conferir o detalhe com
`GET /expenses/{id}`.

### Tests for User Story 2

- [X] T023 [P] [US2] Testes do calculador em `TST/Domain.Tests/Calculations/InstallmentCalculatorScheduleTest.cs`: modo Total com e sem sobra (100,00 / 3 = 33,33 + 33,33 + 33,34), modo Installment (1.250 × 48 = 60.000), à vista, soma das parcelas = total para muitos valores aleatórios (`[Theory]`), datas 31/01 → 28/02 → 31/03, 29/02 em ano bissexto, cruzando o ano, 480 parcelas (R§3)
- [X] T024 [P] [US2] Criar `TST/CommonTestUtilities/Requests/RequestRegisterExpenseJsonBuilder.cs` e `TST/CommonTestUtilities/Entities/ExpenseBuilder.cs` (gera parcelas pelo calculador)
- [X] T025 [P] [US2] Testes do validador em `TST/Validators.Tests/Expense/RegisterExpenseValidatorTest.cs`: uma regra por caso da tabela de validação de data-model.md (Expense), incluindo vários erros juntos
- [X] T026 [P] [US2] Testes de use case em `TST/UseCases.Tests/Expense/Register/RegisterExpenseUseCaseTest.cs`: sucesso nos dois modos, `alreadyPaidInstallments` marca as N primeiras com `paid_on = due_date`, categoria inexistente junto com outros erros, notes em branco vira `null`
- [X] T027 [P] [US2] Testes do resumo em `TST/UseCases.Tests/Summaries/ExpenseSummaryTest.cs`: pagas/faltantes, pago, desconto, restante, status, próximo vencimento, última data e a invariante `pago + desconto + restante = total`
- [X] T028 [P] [US2] Testes de integração em `TST/WebApi.Tests/Expense/RegisterExpenseTest.cs` e `GetExpenseByIdTest.cs`: 201 com valores calculados (cenários US2-1..5), 400 com todas as mensagens, 404 para id inexistente, 401 sem token

### Implementation for User Story 2

- [X] T029 [US2] Adicionar versões 4 e 5 em `INF/Migrations/DatabaseVersions.cs` e criar `INF/Migrations/Versions/Version0000004.cs` (`expenses`, FKs, checks, índices; data-model.md `Expense.UserId`, `Expense.CategoryId`, `Expense.Name`, `Expense.AmountType`, `Expense.TotalAmount`, `Expense.InstallmentAmount`, `Expense.InstallmentsCount`, `Expense.FirstDueDate`, `Expense.Notes`) e `Version0000005.cs` (`expense_installments`, FK cascade, checks, índices; data-model.md `ExpenseInstallment.ExpenseId`, `ExpenseInstallment.Number`, `ExpenseInstallment.DueDate`, `ExpenseInstallment.Amount`, `ExpenseInstallment.PaidOn`, `ExpenseInstallment.PaidAmount`, `ExpenseInstallment.Prepaid`)
- [X] T030 [P] [US2] Criar `DOM/Enums/AmountType.cs` e as entidades `DOM/Entities/Expense.cs` e `DOM/Entities/ExpenseInstallment.cs` (`IsPaid`, `Discount` calculados; data-model.md Expense e ExpenseInstallment)
- [X] T031 [US2] Criar `DOM/Calculations/InstallmentCalculator.cs` com `BuildSchedule(amountType, amount, count, firstDueDate)` devolvendo total, valor da parcela e parcelas, em centavos inteiros (R§1, R§3)
- [X] T032 [P] [US2] Criar `DOM/Repositories/Expense/IExpenseReadOnlyRepository.cs` (`GetById` com parcelas e categoria), `IExpenseWriteOnlyRepository.cs` (`Add`, `Delete`) e `IExpenseUpdateOnlyRepository.cs` (`GetById` rastreado com parcelas)
- [X] T033 [US2] Criar `INF/DataAccess/Configurations/ExpenseConfiguration.cs` e `ExpenseInstallmentConfiguration.cs` (snake_case, `DateOnly` → `date`, `decimal` → `numeric(12,2)`, enum como `smallint`) e `INF/DataAccess/Repositories/ExpenseRepository.cs`; registrar em `INF/DependencyInjectionExtension.cs`
- [X] T034 [P] [US2] Criar `COM/Enums/AmountType.cs` e `COM/Enums/ExpenseStatus.cs`, `COM/Requests/RequestRegisterExpenseJson.cs`, `COM/Responses/ResponseExpenseJson.cs`, `ResponseShortExpenseJson.cs`, `ResponseInstallmentJson.cs` e `ResponseCategorySummaryJson.cs` (`id`, `name`) conforme contracts/api.md
- [X] T035 [US2] Criar `APP/Summaries/ExpenseSummary.cs` (valores calculados de data-model.md) e `APP/Summaries/ExpenseMapper.cs` (entidade → `ResponseExpenseJson`/`ResponseShortExpenseJson`)
- [X] T036 [US2] Criar `APP/UseCases/Expense/ExpenseValidator.cs` (regras comuns a registro e edição; data-model.md `Expense.Name`, `Expense.AmountType`, `Expense.TotalAmount`, `Expense.InstallmentAmount`, `Expense.InstallmentsCount`, `Expense.FirstDueDate`, `Expense.Notes`) e `APP/UseCases/Expense/Register/RegisterExpenseValidator.cs` (+ `alreadyPaidInstallments` entre 0 e a quantidade de parcelas)
- [X] T037 [US2] Criar `APP/UseCases/Expense/Register/` (normaliza, valida, checa a categoria do dono junto com os demais erros, gera o cronograma, marca as já pagas, salva) e `APP/UseCases/Expense/GetById/`; registrar em `APP/DependencyInjectionExtension.cs`
- [X] T038 [US2] Criar `API/Controllers/ExpensesController.cs` com POST (201) e GET `{id}`

**Checkpoint**: US1 e US2 funcionam; a despesa mostra as 13 informações da planilha (SC-005).

---

## Phase 5: User Story 3 - Acompanhar e pagar parcelas (Priority: P1)

**Goal**: listar despesas com filtros e totais, pagar e desfazer parcelas, visão mensal.

**Independent Test**: com despesas cadastradas, pagar parcelas e conferir lista, detalhe e
visão mensal (US3-1..9).

### Tests for User Story 3

- [X] T039 [P] [US3] Testes de use case em `TST/UseCases.Tests/Expense/GetAll/GetExpensesUseCaseTest.cs`: filtros por categoria e status, ordem (próximo vencimento, quitadas por último), totais só das despesas listadas
- [X] T040 [P] [US3] Testes de use case em `TST/UseCases.Tests/Expense/PayInstallment/` e `UndoInstallmentPayment/`: data padrão = `ICalendar.Today()`, data futura → 400, idempotência, fora de ordem, despesa/parcela inexistente → NotFound, quitação quando a última em aberto é paga
- [X] T041 [P] [US3] Testes de use case em `TST/UseCases.Tests/Installment/GetMonthly/GetMonthlyInstallmentsUseCaseTest.cs`: padrão mês atual, totais (total = pago + em aberto), mês vazio com zeros, ano/mês inválidos → 400
- [X] T042 [P] [US3] Testes de integração em `TST/WebApi.Tests/Expense/GetExpensesTest.cs`, `InstallmentPaymentTest.cs` e `TST/WebApi.Tests/Installment/GetMonthlyInstallmentsTest.cs`: cenários US3-1..9 no PostgreSQL real, incluindo a regra de pertencimento ao mês (R§12) com pagamento em atraso aparecendo no mês do vencimento

### Implementation for User Story 3

- [X] T043 [US3] Adicionar `GetAll(userId, categoryId?, status?)` em `IExpenseReadOnlyRepository` e `ExpenseRepository` (com parcelas e categoria; filtro de status aplicado após o cálculo ou via `Any` nas parcelas)
- [X] T044 [P] [US3] Criar `DOM/Repositories/Installment/IInstallmentReadOnlyRepository.cs` com `GetByMonth(userId, monthStart, nextMonthStart, categoryId?)` e implementar em `INF/DataAccess/Repositories/InstallmentRepository.cs` com a condição de R§12; registrar em DI
- [X] T045 [P] [US3] Criar `COM/Responses/ResponseExpensesJson.cs`, `ResponseMonthlyInstallmentsJson.cs`, `ResponseMonthlyInstallmentJson.cs` e `COM/Requests/RequestPayInstallmentJson.cs` conforme contracts/api.md
- [X] T046 [US3] Adicionar em `DOM/Entities/ExpenseInstallment.cs` os métodos `Pay(paidOn)` (valor cheio, `Prepaid = false`, idempotente) e `UndoPayment()`; cobrir em `TST/Domain.Tests/Entities/ExpenseInstallmentTest.cs`
- [X] T047 [US3] Criar use cases `APP/UseCases/Expense/GetAll/`, `APP/UseCases/Expense/PayInstallment/`, `APP/UseCases/Expense/UndoInstallmentPayment/` e `APP/UseCases/Installment/GetMonthly/` (calcula `paidInAdvance` e totais); registrar em DI
- [X] T048 [US3] Adicionar em `API/Controllers/ExpensesController.cs` GET (query `categoryId`, `status`), POST e DELETE `{id}/installments/{number}/payment`; criar `API/Controllers/InstallmentsController.cs` com GET (query `year`, `month`, `categoryId`)

**Checkpoint**: MVP da planilha completo (US1–US3).

---

## Phase 6: User Story 4 - Amortizar uma dívida (Priority: P2)

**Goal**: pagar parcelas futuras com valor efetivamente pago e desconto.

**Independent Test**: amortizar parcelas e conferir despesa, desconto e visão mensal
(US4-1..6).

### Tests for User Story 4

- [X] T049 [P] [US4] Testes do calculador em `TST/Domain.Tests/Calculations/InstallmentCalculatorAmortizationTest.cs`: distribuição pelo maior resto soma exatamente o valor pago, proporcional, nenhuma cota > valor da parcela, valor pago igual à soma (desconto zero), última parcela com centavos a mais (R§4)
- [X] T050 [P] [US4] Testes do validador em `TST/Validators.Tests/Expense/AmortizeExpenseValidatorTest.cs` (linhas de amortização da tabela de pagamento de data-model.md)
- [X] T051 [P] [US4] Testes de use case em `TST/UseCases.Tests/Expense/Amortize/AmortizeExpenseUseCaseTest.cs`: por quantidade escolhe as últimas em aberto, por números aceita qualquer conjunto em aberto, parcela paga/inexistente/repetida → 400, valor maior que a soma → 400, data futura → 400, quita a despesa quando cobre todas
- [X] T052 [P] [US4] Testes de integração em `TST/WebApi.Tests/Expense/AmortizeExpenseTest.cs`: cenário US4-1 (6 × 1.250 por 6.000 → desconto 1.500), visão mensal do mês do pagamento com `paidInAdvance: true` e mês de vencimento sem a parcela (US4-4), desfazer remove o desconto (US4-6)

### Implementation for User Story 4

- [X] T053 [US4] Adicionar `DistributePayment(amounts, paidAmount)` em `DOM/Calculations/InstallmentCalculator.cs` (maior resto em centavos, R§4) e `PayInAdvance(paidOn, paidAmount)` em `DOM/Entities/ExpenseInstallment.cs` (data-model.md `ExpenseInstallment.PaidAmount`, `ExpenseInstallment.Prepaid`)
- [X] T054 [P] [US4] Criar `COM/Requests/RequestAmortizeExpenseJson.cs` (`installmentNumbers`, `quantity`, `paidOn`, `paidAmount`)
- [X] T055 [US4] Criar `APP/UseCases/Expense/Amortize/AmortizeExpenseValidator.cs` e o use case `AmortizeExpenseUseCase` (seleção das parcelas, distribuição, gravação); registrar em DI
- [X] T056 [US4] Adicionar POST `{id}/amortizations` em `API/Controllers/ExpensesController.cs`

**Checkpoint**: amortização funcionando sem quebrar US1–US3.

---

## Phase 7: User Story 5 - Corrigir ou remover uma despesa (Priority: P2)

**Goal**: editar dados (com recálculo das parcelas) e remover despesas.

**Independent Test**: editar e remover despesas (US5-1..5).

### Tests for User Story 5

- [X] T057 [P] [US5] Testes de use case em `TST/UseCases.Tests/Expense/Update/UpdateExpenseUseCaseTest.cs`: mudar só nome/categoria/notes não toca nas parcelas; mudança estrutural recalcula mantendo as N primeiras pagas com as datas antigas em ordem (R§11); nova quantidade < N → 400; com parcela amortizada → 400; categoria inexistente → 400; despesa inexistente → NotFound
- [X] T058 [P] [US5] Testes de use case em `TST/UseCases.Tests/Expense/Delete/DeleteExpenseUseCaseTest.cs` (sucesso, NotFound)
- [X] T059 [P] [US5] Testes de integração em `TST/WebApi.Tests/Expense/UpdateExpenseTest.cs` e `DeleteExpenseTest.cs`: cenários US5-1..5, parcelas removidas em cascata, categoria passa a ser removível depois de remover suas despesas

### Implementation for User Story 5

- [X] T060 [P] [US5] Criar `COM/Requests/RequestUpdateExpenseJson.cs` (igual ao registro, sem `alreadyPaidInstallments`)
- [X] T061 [US5] Adicionar em `DOM/Entities/Expense.cs` o método `Reschedule(...)` com as regras de R§11 (usa `InstallmentCalculator.BuildSchedule`) e cobrir em `TST/Domain.Tests/Entities/ExpenseTest.cs`
- [X] T062 [US5] Criar `APP/UseCases/Expense/Update/` (validator reaproveitando `ExpenseValidator`, detecção de mudança estrutural) e `APP/UseCases/Expense/Delete/`; registrar em DI
- [X] T063 [US5] Adicionar PUT `{id}` (200) e DELETE `{id}` (204) em `API/Controllers/ExpensesController.cs`

**Checkpoint**: todas as histórias funcionam de forma independente.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T064 [P] Adicionar os cenários do quickstart em `API/Hozelo.Api.http`
- [X] T065 [P] Conferir no Swagger que todos os endpoints novos exigem Bearer e documentam os status de contracts/api.md
- [X] T066 Rodar `dotnet build` (0 warnings) e `dotnet test` na pasta `backend`
- [X] T067 Executar o roteiro de [quickstart.md](quickstart.md) contra o PostgreSQL local e registrar o resultado

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende do Setup; bloqueia todas as histórias.
- **US1 (Phase 3)**: depende da Foundational.
- **US2 (Phase 4)**: depende da US1 (despesa exige categoria).
- **US3 (Phase 5)**: depende da US2.
- **US4 (Phase 6)** e **US5 (Phase 7)**: dependem da US3 (usam pagamento e visão mensal);
  podem ser feitas em paralelo entre si, exceto pelos arquivos compartilhados
  `ExpensesController.cs`, `Expense.cs` e `APP/DependencyInjectionExtension.cs`.
- **Polish (Phase 8)**: depois das histórias desejadas.

### User Story Dependencies

```text
US1 ──▶ US2 ──▶ US3 ──┬──▶ US4
                      └──▶ US5
```

### Within Each User Story

- Testes primeiro (devem falhar), depois migration → domínio → infraestrutura → contratos →
  application → controller.
- Em US2, o `InstallmentCalculator` (T031) vem antes de `ExpenseBuilder` compilar os testes.

### Parallel Opportunities

- T003, T005, T007, T009 na Foundational.
- Em cada história, todas as tarefas de teste [P] juntas; depois entidades, interfaces e
  contratos [P] juntos.
- US4 e US5 em paralelo após a US3, cuidando dos arquivos compartilhados.

---

## Parallel Example: User Story 2

```text
# Testes juntos:
T023 InstallmentCalculatorScheduleTest
T025 RegisterExpenseValidatorTest
T026 RegisterExpenseUseCaseTest
T027 ExpenseSummaryTest
T028 RegisterExpenseTest / GetExpenseByIdTest

# Depois, em paralelo:
T030 entidades e enum
T032 interfaces de repositório
T034 contratos de request/response
```

---

## Implementation Strategy

### MVP First (US1 → US3)

1. Setup + Foundational.
2. US1 (categorias) → validar.
3. US2 (registrar) → validar.
4. US3 (lista, pagamento, visão mensal) → **parar e validar**: a família já substitui a
   planilha.

### Incremental Delivery

1. US1–US3 = MVP.
2. US4 (amortização).
3. US5 (edição e remoção).
4. Polish.

Um commit por história (Conventional Commits), como na feature 001.

---

## Notes

- [P] = arquivos diferentes, sem dependências pendentes.
- Nunca editar migrations já aplicadas (1 e 2); as novas são 3, 4 e 5.
- Dinheiro sempre em `decimal`; cálculo de divisão sempre em centavos inteiros.
- Confirmar que os testes falham antes de implementar.
