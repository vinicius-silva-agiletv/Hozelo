---

description: "Task list for feature 004-third-party-reimbursements (Reembolsos de Terceiros)"
---

# Tasks: Reembolsos de Terceiros

**Input**: Design documents from `/specs/004-third-party-reimbursements/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: obrigatórios pela constitution (Princípio III): validators, use cases, integração de
cada endpoint e `Domain.Tests` para os calculadores. Testes antes da implementação em cada história.

**Organization**: tarefas por história de usuário (US1..US5).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história de usuário

## Path Conventions

- `API/` = `backend/src/Backend/Hozelo.Api/`
- `APP/` = `backend/src/Backend/Hozelo.Application/`
- `DOM/` = `backend/src/Backend/Hozelo.Domain/`
- `INF/` = `backend/src/Backend/Hozelo.Infrastructure/`
- `COM/` = `backend/src/Shared/Hozelo.Communication/`
- `EXC/` = `backend/src/Shared/Hozelo.Exception/`
- `TST/` = `backend/tests/`

Mensagens, status e JSON: [contracts/api.md](contracts/api.md). Restrições e mensagens:
[data-model.md](data-model.md). Decisões: [research.md](research.md) (R§n). Controllers com
`[AuthenticatedUser]`; tudo filtrado pelo usuário autenticado.

---

## Phase 1: Setup

- [X] T001 Depois do merge da feature 003 na `main`, reposicionar a branch com `git rebase --onto main 003-incomes-monthly-balance 004-third-party-reimbursements` e confirmar `dotnet test` verde (276 testes)

---

## Phase 2: Foundational

- [X] T002 Adicionar em `EXC/ResourceMessagesException.resx` e `EXC/ResourceMessagesException.Designer.cs` as mensagens da tabela "Validações e mensagens novas" de data-model.md
- [X] T003 [P] Criar `DOM/Enums/ChargeOriginType.cs` (Expense, Recurrence, Manual) e `DOM/Enums/ChargeStatus.cs` (Paid, Partial, Open), os equivalentes em `COM/Enums/`, e adicionar `Reimbursement = 4` em `DOM/Enums/LedgerSource.cs` e `COM/Enums/LedgerSource.cs`

---

## Phase 3: User Story 1 - Cadastrar as pessoas (Priority: P1) 🎯 MVP

**Goal**: CRUD de pessoas.

**Independent Test**: criar, listar, renomear e remover pessoas (US1-1..4).

### Tests for User Story 1

- [X] T004 [P] [US1] Criar `TST/CommonTestUtilities/Entities/PersonBuilder.cs` e `TST/CommonTestUtilities/Requests/RequestPersonJsonBuilder.cs`
- [X] T005 [P] [US1] Testes do validador em `TST/Validators.Tests/Person/PersonValidatorTest.cs` (data-model.md `Person.Name`)
- [X] T006 [P] [US1] Testes de use case em `TST/UseCases.Tests/Person/PersonUseCasesTest.cs` (nome repetido → 409, NotFound, remoção com lançamentos → 409)
- [X] T007 [P] [US1] Testes de integração em `TST/WebApi.Tests/Person/PeopleTest.cs` (201/400/409/404/204, ordem alfabética, 401)

### Implementation for User Story 1

- [X] T008 [US1] Criar `INF/Migrations/Versions/Version0000010.cs` com `people` e índice `(user_id, lower(name))` (data-model.md `Person.UserId`, `Person.Name`) e a constante em `INF/Migrations/DatabaseVersions.cs`
- [X] T009 [P] [US1] Criar `DOM/Entities/Person.cs` e `DOM/Repositories/Person/IPersonReadOnlyRepository.cs`, `IPersonWriteOnlyRepository.cs`, `IPersonUpdateOnlyRepository.cs` (com `HasEntries`)
- [X] T010 [US1] Criar `INF/DataAccess/Configurations/PersonConfiguration.cs`, `INF/DataAccess/Repositories/PersonRepository.cs`, DI e tratamento do índice único em `INF/DataAccess/UnitOfWork.cs`
- [X] T011 [P] [US1] Criar `COM/Requests/RequestPersonJson.cs`, `COM/Responses/ResponsePersonJson.cs`, `ResponsePeopleJson.cs`, `ResponsePersonSummaryJson.cs` (`id`, `name`)
- [X] T012 [US1] Criar validador e use cases `Register`, `Update`, `Delete`, `GetAll` em `APP/UseCases/Person/` e registrar em `APP/DependencyInjectionExtension.cs`
- [X] T013 [US1] Criar `API/Controllers/PeopleController.cs` com GET/POST `/people` e PUT/DELETE `/people/{id}`

---

## Phase 4: User Story 2 - Marcar despesas e contas fixas (Priority: P1)

**Goal**: despesas e contas fixas marcadas geram cobranças para a pessoa.

**Independent Test**: US2-1..7 pelo extrato bruto de cobranças (cobranças calculadas).

### Tests for User Story 2

- [X] T014 [P] [US2] Testes do calculador em `TST/Domain.Tests/Calculations/ChargeCalculatorTest.cs`: 100% = valores das parcelas; 50% com soma exata em centavos (SC-005); parcela amortizada usa o valor pago; antecipada no mês do pagamento; conta fixa com ajuste e pulo; conta fixa sem fim limitada ao mês pedido; chaves `Installment:`, `Recurrence:`, `Manual:` (R§4)
- [X] T015 [P] [US2] Atualizar testes de validador e use case de despesa e de recorrência (`TST/Validators.Tests/Expense/`, `TST/Validators.Tests/Recurrence/`, `TST/UseCases.Tests/Expense/`, `TST/UseCases.Tests/Recurrence/`): percentual 1–100, percentual sem pessoa, pessoa inexistente, receita recorrente com pessoa → 400
- [X] T016 [P] [US2] Testes de integração em `TST/WebApi.Tests/Person/MarkedEntriesTest.cs`: despesa e conta fixa marcadas aparecem como cobranças no extrato; editar, desmarcar e remover refletem; despesa continua nas saídas da família

### Implementation for User Story 2

- [X] T017 [US2] Criar `INF/Migrations/Versions/Version0000011.cs` com `person_id`/`person_percent` em `expenses` e `recurring_entries` e checks (data-model.md `Expense.PersonId`, `Expense.PersonPercent`, `RecurringEntry.PersonId`, `RecurringEntry.PersonPercent`)
- [X] T018 [US2] Adicionar `PersonId`, `PersonPercent` e navegação `Person` em `DOM/Entities/Expense.cs` e `DOM/Entities/RecurringEntry.cs` e nas configurações EF; incluir `Person` nos repositórios de leitura de despesas e recorrências
- [X] T019 [P] [US2] Adicionar `PersonId`/`PersonPercent` em `COM/Requests/RequestUpdateExpenseJson.cs` e `COM/Requests/RequestUpdateRecurrenceJson.cs`, e `Person`/`PersonPercent` em `COM/Responses/ResponseShortExpenseJson.cs` e `COM/Responses/ResponseShortRecurrenceJson.cs`
- [X] T020 [US2] Validar e gravar a marcação em `APP/UseCases/Expense/` (validador, Register, Update, mapper) e `APP/UseCases/Recurrence/` (validadores, Register, Update, mapper), com checagem de pessoa do usuário e só `kind = Expense`
- [X] T021 [US2] Criar `DOM/Calculations/Charge.cs` e `DOM/Calculations/ChargeCalculator.cs` (despesas marcadas com `DistributePayment`, contas fixas via `RecurrenceCalculator`, avulsas) conforme R§4
- [X] T022 [US2] Adicionar consultas de marcados: `GetMarkedByPerson` em `DOM/Repositories/Expense/IExpenseReadOnlyRepository.cs` e `DOM/Repositories/Recurrence/IRecurrenceReadOnlyRepository.cs` (e implementações); criar `APP/UseCases/Person/PersonLedgerLoader.cs` (carrega pessoa, despesas e contas fixas marcadas, avulsas e pagamentos e devolve cobranças + pagamentos)

---

## Phase 5: User Story 3 - Cobranças avulsas (Priority: P2)

**Goal**: registrar, editar e remover cobranças avulsas.

**Independent Test**: US3-1..3.

- [X] T023 [P] [US3] Testes em `TST/Validators.Tests/Person/PersonChargeValidatorTest.cs` (data-model.md `PersonCharge.Description`, `PersonCharge.Amount`, `PersonCharge.ChargeDate`, `PersonCharge.Notes`) e `TST/WebApi.Tests/Person/PersonChargesTest.cs` (201/200/204/404/400)
- [X] T024 [US3] Criar `INF/Migrations/Versions/Version0000012.cs` com `person_charges` (data-model.md `PersonCharge.UserId`, `PersonCharge.PersonId`, `PersonCharge.Description`, `PersonCharge.Amount`, `PersonCharge.ChargeDate`, `PersonCharge.Notes`), entidade `DOM/Entities/PersonCharge.cs`, repositório, configuração e DI
- [X] T025 [US3] Criar requests/responses em `COM/`, validador e use case em `APP/UseCases/Person/Charges/`, e as rotas POST/PUT/DELETE `/people/{id}/charges` em `API/Controllers/PeopleController.cs`

---

## Phase 6: User Story 4 - Pagamentos, extrato e resumo (Priority: P1)

**Goal**: pagamentos com cobranças escolhidas, saldo que passa adiante, extrato mensal, resumo por
origem e saldos na lista de pessoas.

**Independent Test**: US4-1..14.

### Tests for User Story 4

- [X] T026 [P] [US4] Testes em `TST/Domain.Tests/Calculations/PaymentAllocatorTest.cs`: sem escolha (mais antiga primeiro), com escolha, escolha maior/menor que o pagamento, chave inexistente ignorada, crédito abatendo cobranças futuras, crédito não alocado, ordem dos pagamentos por data (R§6)
- [X] T027 [P] [US4] Testes em `TST/Domain.Tests/Calculations/PersonStatementCalculatorTest.cs`: saldo anterior/final, encadeamento `previousBalance(M+1) = endBalance(M)` (SC-002), crédito negativo, primeiro mês com saldo zero, "deve até hoje" e "deve no total" (R§7)
- [X] T028 [P] [US4] Testes em `TST/Validators.Tests/Person/PersonPaymentValidatorTest.cs` (data-model.md `PersonPayment.Amount`, `PersonPayment.PaidOn`, `PersonPayment.Notes`) e use case em `TST/UseCases.Tests/Person/PersonPaymentUseCasesTest.cs` (data futura, cobrança escolhida paga/de outra pessoa → 400)
- [X] T029 [P] [US4] Testes de integração em `TST/WebApi.Tests/Person/PersonStatementTest.cs` (cenários US4-1..12) e `TST/WebApi.Tests/Person/PersonSummaryTest.cs` (US4-13..14, SC-008)

### Implementation for User Story 4

- [X] T030 [US4] Criar `INF/Migrations/Versions/Version0000013.cs` com `person_payments` e `person_payment_targets` (data-model.md `PersonPayment.UserId`, `PersonPayment.PersonId`, `PersonPayment.Amount`, `PersonPayment.PaidOn`, `PersonPayment.Notes`, `PersonPaymentTarget.ChargeKey`, `PersonPaymentTarget.Position`), entidades, configurações, repositório e DI
- [X] T031 [US4] Criar `DOM/Calculations/PaymentAllocator.cs` e `DOM/Calculations/PersonStatementCalculator.cs`
- [X] T032 [P] [US4] Criar requests/responses em `COM/` para pagamentos, extrato (`ResponsePersonStatementJson`) e resumo (`ResponsePersonOverviewJson`) conforme contracts/api.md
- [X] T033 [US4] Criar `APP/UseCases/Person/Payments/` (validador; validação das chaves escolhidas pelo estado calculado sem o próprio pagamento), `APP/UseCases/Person/Statement/` e `APP/UseCases/Person/Summary/`; preencher `balanceUntilNow` e `currentMonthDue` no GetAll de pessoas
- [X] T034 [US4] Adicionar as rotas de pagamentos, `/statement` e `/summary` em `API/Controllers/PeopleController.cs`

---

## Phase 7: User Story 5 - Reembolsos no resumo da família (Priority: P2)

**Goal**: reembolsos como entradas no `GET /summaries`, com pendência a receber.

**Independent Test**: US5-1..6 e SC-007.

- [X] T035 [P] [US5] Estender `TST/Domain.Tests/Calculations/BalanceCalculatorTest.cs` para `PendingExempt` e `extraPending` (pagamento de dívida antiga no mês atual não muda o acumulado)
- [X] T036 [P] [US5] Testes de integração em `TST/WebApi.Tests/Summary/ReimbursementsSummaryTest.cs`: item "Reembolso — Sogro" previsto/realizado, pendência com saldo do mês anterior, crédito reduzindo pendência, SC-007, filtro de categoria sem reembolsos
- [X] T037 [US5] Adicionar `PendingExempt` em `DOM/Calculations/LedgerEntry.cs` e o parâmetro `extraPending` em `DOM/Calculations/BalanceCalculator.cs` (Pending ignora isentos; Accumulated soma `extraPending` no mês atual)
- [X] T038 [US5] Em `COM/Responses/ResponseMonthlySummaryJson.cs`: `Category` anulável e `SettledAmount` no item
- [X] T039 [US5] Em `APP/UseCases/Summary/GetMonthly/GetMonthlySummaryUseCase.cs`: gerar entradas de cobranças e pagamentos por pessoa (sem filtro de categoria), agregar um item por pessoa no mês, pendências por pessoa com saldo do mês anterior e repassar `extraPending`

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T040 [P] Adicionar os cenários do quickstart em `API/Hozelo.Api.http`
- [X] T041 [P] Conferir no Swagger os endpoints novos e os campos novos de despesas, recorrências e resumo
- [X] T042 Rodar `dotnet build` (0 warnings) e `dotnet test` em `backend/`
- [X] T043 Executar o roteiro de [quickstart.md](quickstart.md) contra o PostgreSQL local (banco temporário)

---

## Dependencies & Execution Order

```text
Setup (rebase) → Foundational → US1 → US2 ─┬→ US4 → US5 → Polish
                                  └→ US3 ──┘
```

- **US1** é pré-requisito de tudo (pessoa).
- **US2** e **US3** podem andar em paralelo após a US1 (US3 é independente de despesas), exceto
  pelos arquivos compartilhados `PeopleController.cs`, DI e `DatabaseVersions.cs` (migrations 11 e
  12 nessa ordem).
- **US4** depende de US2 e US3 (cobranças das três origens).
- **US5** depende da US4 (saldos das pessoas).

### Parallel Opportunities

- Tarefas de teste [P] de cada história juntas; contratos em `COM/` em paralelo com domínio.
- US2 e US3 em paralelo.

---

## Parallel Example: User Story 4

```text
T026 PaymentAllocatorTest
T027 PersonStatementCalculatorTest
T028 validador + use case de pagamentos
T029 PersonStatementTest / PersonSummaryTest
```

---

## Implementation Strategy

1. Rebase + fundação + US1 + US2 → cobranças das compras do cartão já aparecem por pessoa.
2. US4 → pagamentos, saldo que passa adiante, extrato e resumo (**MVP de uso real**).
3. US3 → cobranças avulsas.
4. US5 → reembolsos no resumo da família.
5. Polish.

Um commit por etapa com testes verdes.

---

## Notes

- Nunca editar migrations 1–9; as novas são 10 a 13.
- Cobranças de despesas e contas fixas nunca são gravadas (R§3).
- Contratos das features 002/003 só ganham campos opcionais; manter os testes existentes verdes.
