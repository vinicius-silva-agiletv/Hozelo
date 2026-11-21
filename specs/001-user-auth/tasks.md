---

description: "Task list for feature 001-user-auth (Cadastro e Login de Usuário)"
---

# Tasks: Cadastro e Login de Usuário

**Input**: Design documents from `/specs/001-user-auth/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: obrigatórios pela constitution (Princípio III): validators, use cases e integração
de cada endpoint. Em cada história, escreva os testes antes da implementação e confirme que
falham.

**Organization**: tarefas agrupadas por história de usuário para implementação e teste
independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história de usuário da tarefa (US1, US2, US3)

## Path Conventions

- `API/` = `backend/src/Backend/Hozelo.Api/`
- `APP/` = `backend/src/Backend/Hozelo.Application/`
- `DOM/` = `backend/src/Backend/Hozelo.Domain/`
- `INF/` = `backend/src/Backend/Hozelo.Infrastructure/`
- `COM/` = `backend/src/Shared/Hozelo.Communication/`
- `EXC/` = `backend/src/Shared/Hozelo.Exception/`
- `TST/` = `backend/tests/`

Mensagens pt-BR, status HTTP e formatos JSON: ver [contracts/api.md](contracts/api.md).
Restrições de campos: ver [data-model.md](data-model.md). Decisões: ver
[research.md](research.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: pacotes e configuração base

- [X] T001 Adicionar pacotes de produção conforme tabela "Dependências NuGet novas" do plan.md: FluentValidation em `APP/Hozelo.Application.csproj`; Npgsql.EntityFrameworkCore.PostgreSQL, FluentMigrator.Runner.Postgres, Dapper, BCrypt.Net-Next e System.IdentityModel.Tokens.Jwt em `INF/Hozelo.Infrastructure.csproj`
- [X] T002 [P] Adicionar pacotes de teste: Moq, Bogus, Shouldly, Microsoft.Extensions.TimeProvider.Testing em `TST/CommonTestUtilities/CommonTestUtilities.csproj`, `TST/UseCases.Tests/UseCases.Tests.csproj` e `TST/Validators.Tests/Validators.Tests.csproj`; Microsoft.AspNetCore.Mvc.Testing, Testcontainers.PostgreSql e Shouldly em `TST/WebApi.Tests/WebApi.Tests.csproj`
- [X] T003 [P] Conferir referências entre projetos (Api → Application, Infrastructure, Communication, Exception; Application → Domain, Communication, Exception; Infrastructure → Domain, Exception; testes → projetos testados + CommonTestUtilities) nos `.csproj` de `backend/src` e `backend/tests`
- [X] T004 [P] Adicionar seção `Settings` sem segredos em `API/appsettings.json` (`Settings:Jwt:ExpirationTimeMinutes` = 10080, `Settings:LoginLockout:MaxFailedAttempts` = 5, `Settings:LoginLockout:LockoutMinutes` = 15) e `UserSecretsId` em `API/Hozelo.Api.csproj` (research.md §2, §7)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: fundação reutilizada por todas as histórias. Nenhuma história começa antes
desta fase terminar.

### Erros e mensagens

- [X] T005 [P] Criar `EXC/ResourceMessagesException.resx` (pt-BR, com designer público) contendo todas as mensagens de data-model.md e contracts/api.md, mais "Erro desconhecido."
- [X] T006 [P] Criar `EXC/ExceptionsBase/HozeloException.cs` (abstrata, `GetErrorMessages()` e `GetStatusCode()`) e derivadas `ErrorOnValidationException` (400, lista), `InvalidLoginException` (401), `UnauthorizedException` (401), `AccountAlreadyExistsException` (409), `TooManyLoginAttemptsException` (429) em `EXC/ExceptionsBase/` (research.md §9)
- [X] T007 [P] Criar `COM/Responses/ResponseErrorJson.cs` (`Errors: IList<string>`)
- [X] T008 Criar `API/Filters/ExceptionFilter.cs` convertendo `HozeloException` em `ResponseErrorJson` com o status da exceção e qualquer outra exceção em 500 "Erro desconhecido." sem detalhes; registrar em `API/Program.cs`

### Domínio e acesso a dados

- [X] T009 [P] Criar `DOM/Entities/EntityBase.cs` com `Id`, `CreatedOn` (UTC) e `Active` conforme data-model.md `EntityBase.Id`, `EntityBase.CreatedOn`, `EntityBase.Active`
- [X] T010 [P] Criar `DOM/Repositories/IUnitOfWork.cs` (`Commit()` assíncrono)
- [X] T011 Criar `INF/DataAccess/HozeloDbContext.cs` (convenção snake_case, aplica configurações do assembly) e `INF/DataAccess/UnitOfWork.cs`
- [X] T012 Criar `INF/Migrations/DatabaseVersions.cs` (constantes sequenciais) e `INF/Migrations/DatabaseMigration.cs`: cria o banco com Dapper + Npgsql conectando no banco `postgres` se não existir, depois executa `MigrateUp` do FluentMigrator (research.md §5)
- [X] T013 Criar `INF/DependencyInjectionExtension.cs` (`AddInfrastructure`: DbContext com `ConnectionStrings:Connection`, FluentMigrator runner, UnitOfWork, `TimeProvider.System`) e `APP/DependencyInjectionExtension.cs` (`AddApplication`)
- [X] T014 Atualizar `API/Program.cs`: chamar `AddApplication`/`AddInfrastructure`, executar `DatabaseMigration` na inicialização e manter `public partial class Program`

### Base de testes

- [X] T015 [P] Criar `TST/WebApi.Tests/HozeloWebApplicationFactory.cs`: sobe PostgreSQL com Testcontainers, injeta connection string, chave JWT de teste e `FakeTimeProvider`, implementa `IAsyncLifetime`; método para limpar `users` e reiniciar `login_throttle` entre testes
- [X] T016 [P] Criar `TST/WebApi.Tests/HozeloClassFixture.cs` com helpers `DoPost`, `DoGet` (com token opcional) e leitura de `errors` da resposta
- [X] T017 [P] Criar `TST/CommonTestUtilities/Repositories/UnitOfWorkBuilder.cs` (mock de `IUnitOfWork`)

**Checkpoint**: API sobe, cria o banco `hozelo` e a tabela `VersionInfo`; erro inesperado
retorna 500 padronizado.

---

## Phase 3: User Story 1 - Criar a conta da família (Priority: P1) 🎯 MVP

**Goal**: `POST /users` cria a única conta e devolve nome + token.

**Independent Test**: com banco vazio, cadastrar com dados válidos retorna 201 com token;
segundo cadastro retorna 409; dados inválidos retornam 400 com todas as mensagens.

### Tests for User Story 1

- [X] T018 [P] [US1] Criar `TST/CommonTestUtilities/Requests/RequestRegisterUserJsonBuilder.cs` (Bogus, senha configurável) e `TST/CommonTestUtilities/Entities/UserBuilder.cs` (retorna usuário + senha em texto)
- [X] T019 [P] [US1] Criar fakes `TST/CommonTestUtilities/Cryptography/PasswordEncripterBuilder.cs`, `TST/CommonTestUtilities/Tokens/AccessTokenGeneratorBuilder.cs`, `TST/CommonTestUtilities/Repositories/UserReadOnlyRepositoryBuilder.cs` e `TST/CommonTestUtilities/Repositories/UserWriteOnlyRepositoryBuilder.cs`
- [X] T020 [P] [US1] Criar `TST/Validators.Tests/User/Register/RegisterUserValidatorTest.cs`: sucesso; nome vazio/só espaços/>100; e-mail vazio/inválido/>255; senha vazia/<8/exatamente 8 aceita/>72 bytes; múltiplos erros juntos (data-model.md `User.Name`, `User.Email`, `User.Password`)
- [X] T021 [P] [US1] Criar `TST/UseCases.Tests/User/Register/RegisterUserUseCaseTest.cs`: sucesso devolve nome e token; conta já existente lança `AccountAlreadyExistsException` (inclusive com dados inválidos); dados inválidos lançam `ErrorOnValidationException` com todas as mensagens; e-mail e nome normalizados antes de salvar
- [X] T022 [P] [US1] Criar `TST/WebApi.Tests/User/Register/RegisterUserTest.cs`: 201 com `name` e `tokens.accessToken`; 409 no segundo cadastro com outro e-mail; 400 com mensagens em pt-BR; e-mail gravado em minúsculo

### Implementation for User Story 1

- [X] T023 [P] [US1] Criar `DOM/Entities/User.cs` herdando `EntityBase`, com campos de data-model.md `User.UserIdentifier`, `User.Name`, `User.Email`, `User.Password`
- [X] T024 [P] [US1] Criar `DOM/Repositories/User/IUserReadOnlyRepository.cs` (`ExistsAnyUser`, `GetByEmail`, `GetByUserIdentifier`) e `DOM/Repositories/User/IUserWriteOnlyRepository.cs` (`Add`)
- [X] T025 [P] [US1] Criar `DOM/Security/Cryptography/IPasswordEncripter.cs` (`Encrypt`, `IsValid`) e `DOM/Security/Tokens/IAccessTokenGenerator.cs` (`Generate(Guid userIdentifier)`)
- [X] T026 [P] [US1] Criar `COM/Requests/RequestRegisterUserJson.cs`, `COM/Responses/ResponseRegisteredUserJson.cs` e `COM/Responses/ResponseTokensJson.cs` conforme contracts/api.md
- [X] T027 [US1] Criar migration `INF/Migrations/Versions/Version0000001.cs`: tabela `users` com colunas de data-model.md `EntityBase.Id`, `EntityBase.CreatedOn`, `EntityBase.Active`, `User.UserIdentifier`, `User.Name`, `User.Email`, `User.Password` e índices `ux_users_user_identifier`, `ux_users_email`, `ux_users_single_account` sobre `((true))` (research.md §6)
- [X] T028 [US1] Criar mapeamento EF de `User` para `users` em `INF/DataAccess/Configurations/UserConfiguration.cs`
- [X] T029 [US1] Criar `INF/DataAccess/Repositories/UserRepository.cs` implementando as duas interfaces de US1; registrar no `INF/DependencyInjectionExtension.cs`
- [X] T030 [P] [US1] Criar `INF/Security/Cryptography/BCryptNet.cs` (work factor 12) implementando `IPasswordEncripter`; registrar no DI (research.md §1)
- [X] T031 [P] [US1] Criar `INF/Security/Tokens/JwtTokenGenerator.cs`: HS256, claim `sid`, expiração de `Settings:Jwt:ExpirationTimeMinutes`, horário de `TimeProvider`; chave de `Settings:Jwt:SigningKey` com falha na inicialização se < 32 caracteres; registrar no DI (research.md §2)
- [X] T032 [US1] Criar `APP/UseCases/User/Register/RegisterUserValidator.cs` com regras de data-model.md `User.Name`, `User.Email`, `User.Password` e mensagens do resource; senha medida em bytes UTF-8 para o teto
- [X] T033 [US1] Criar `APP/UseCases/User/Register/IRegisterUserUseCase.cs` e `RegisterUserUseCase.cs`: checa `ExistsAnyUser` primeiro (409), normaliza nome/e-mail, valida, gera hash, cria `UserIdentifier`, salva, `Commit`, converte violação de índice único em `AccountAlreadyExistsException`, devolve nome + token; registrar no `APP/DependencyInjectionExtension.cs`
- [X] T034 [US1] Criar `API/Controllers/UsersController.cs` com `POST /users` retornando 201 e `ResponseRegisteredUserJson`, documentando 400 e 409 com `ProducesResponseType`

**Checkpoint**: T020–T022 passam; cadastro funciona isoladamente.

---

## Phase 4: User Story 2 - Entrar na conta (Priority: P1)

**Goal**: `POST /login` autentica com e-mail e senha, com bloqueio global após 5 erros.

**Independent Test**: com uma conta semeada no banco pelo teste, login correto retorna 200
com token; senha errada e e-mail inexistente retornam a mesma mensagem 401; 5 erros seguidos
levam a 429 por 15 minutos.

### Tests for User Story 2

- [X] T035 [P] [US2] Criar `TST/CommonTestUtilities/Requests/RequestLoginJsonBuilder.cs` e `TST/CommonTestUtilities/Repositories/LoginThrottleRepositoryBuilder.cs`
- [X] T036 [P] [US2] Criar `TST/UseCases.Tests/Login/DoLogin/DoLoginUseCaseTest.cs`: sucesso; senha errada e e-mail inexistente lançam `InvalidLoginException` com a mesma mensagem; campos vazios lançam `InvalidLoginException`; bloqueado lança `TooManyLoginAttemptsException` mesmo com senha certa; 5ª falha bloqueia; sucesso zera contagem; tentativa durante bloqueio não estende prazo (usar `FakeTimeProvider`)
- [X] T037 [P] [US2] Criar `TST/WebApi.Tests/Login/DoLogin/DoLoginTest.cs`: 200 com token; 401 com mensagem idêntica nos dois casos de falha; 429 após 5 falhas; 200 após avançar o `FakeTimeProvider` em 15 minutos; e-mail com maiúsculas/espaços funciona

### Implementation for User Story 2

- [X] T038 [P] [US2] Criar `DOM/Entities/LoginThrottle.cs` com campos de data-model.md `LoginThrottle.Id`, `LoginThrottle.FailedAttempts`, `LoginThrottle.LockedUntilUtc`
- [X] T039 [P] [US2] Criar `DOM/Repositories/LoginThrottle/ILoginThrottleRepository.cs` (`Get`, `RegisterFailure(maxAttempts, lockUntil)`, `Reset`)
- [X] T040 [P] [US2] Criar `COM/Requests/RequestLoginJson.cs` conforme contracts/api.md
- [X] T041 [US2] Criar migration `INF/Migrations/Versions/Version0000002.cs`: tabela `login_throttle` com data-model.md `LoginThrottle.Id` (check `id = 1`), `LoginThrottle.FailedAttempts`, `LoginThrottle.LockedUntilUtc` e linha inicial `(1, 0, null)`
- [X] T042 [US2] Criar `INF/DataAccess/Configurations/LoginThrottleConfiguration.cs` e `INF/DataAccess/Repositories/LoginThrottleRepository.cs` com `UPDATE` atômico (incrementa; ao atingir o limite define `locked_until_utc` e zera a contagem) conforme a máquina de estados de data-model.md; registrar no DI (research.md §7)
- [X] T043 [US2] Criar `APP/UseCases/Login/DoLogin/IDoLoginUseCase.cs` e `DoLoginUseCase.cs`: verifica bloqueio (429), normaliza e-mail, busca usuário ativo, confere senha, registra falha (401 genérico) ou zera contagem e devolve nome + token; limites de `Settings:LoginLockout` via options; registrar no DI
- [X] T044 [US2] Criar `API/Controllers/LoginController.cs` com `POST /login` retornando 200 e documentando 401 e 429

**Checkpoint**: T036–T037 passam; login funciona com conta criada por US1 ou semeada.

---

## Phase 5: User Story 3 - Ver o perfil da conta (Priority: P2)

**Goal**: `GET /users` devolve nome e e-mail apenas com token válido.

**Independent Test**: com token válido retorna 200 com `name` e `email`; sem token, com
token adulterado, expirado ou de conta inexistente retorna 401 em pt-BR.

### Tests for User Story 3

- [ ] T045 [P] [US3] Criar `TST/CommonTestUtilities/Services/LoggedUserBuilder.cs` e `TST/CommonTestUtilities/Tokens/JwtTokenGeneratorBuilder.cs` (gera token real com a chave de teste)
- [ ] T046 [P] [US3] Criar `TST/UseCases.Tests/User/Profile/GetUserProfileUseCaseTest.cs`: devolve nome e e-mail do usuário logado
- [ ] T047 [P] [US3] Criar `TST/WebApi.Tests/User/Profile/GetUserProfileTest.cs`: 200 sem campos sensíveis; 401 sem token ("É necessário estar autenticado..."); 401 com token adulterado, assinado com outra chave, expirado (avançar `FakeTimeProvider` 7 dias) e de usuário removido ("Sessão inválida ou expirada...")

### Implementation for User Story 3

- [ ] T048 [P] [US3] Criar `DOM/Security/Tokens/IAccessTokenValidator.cs` (`ValidateAndGetUserIdentifier`) e `DOM/Services/LoggedUser/ILoggedUser.cs` (`User()`)
- [ ] T049 [P] [US3] Criar `COM/Responses/ResponseUserProfileJson.cs` conforme contracts/api.md
- [ ] T050 [US3] Criar `INF/Security/Tokens/JwtTokenValidator.cs` (valida assinatura e expiração com `TimeProvider`, sem tolerância de clock) e `INF/Services/LoggedUser/LoggedUser.cs` (lê token via `ITokenProvider`); registrar no DI
- [ ] T051 [US3] Criar `API/Token/HttpContextTokenValue.cs` implementando `ITokenProvider` (header `Authorization: Bearer`) e registrar `IHttpContextAccessor`
- [ ] T052 [US3] Criar `API/Filters/AuthenticatedUserFilter.cs` (token ausente → `UnauthorizedException` "É necessário estar autenticado..."; inválido/expirado/conta inexistente ou inativa → "Sessão inválida ou expirada...") e `API/Attributes/AuthenticatedUserAttribute.cs`
- [ ] T053 [US3] Criar `APP/UseCases/User/Profile/IGetUserProfileUseCase.cs` e `GetUserProfileUseCase.cs` mapeando para `ResponseUserProfileJson`; registrar no DI
- [ ] T054 [US3] Adicionar `GET /users` com `[AuthenticatedUser]` em `API/Controllers/UsersController.cs`

**Checkpoint**: T046–T047 passam; as três histórias funcionam juntas.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T055 [P] Configurar esquema de segurança Bearer no Swagger em `API/Program.cs`
- [ ] T056 [P] Atualizar `API/Hozelo.Api.http` com os cenários do quickstart.md (cadastro, login, perfil)
- [ ] T057 Rodar `dotnet build` sem warnings novos e `dotnet test` em `backend/` com todos os testes passando
- [ ] T058 Executar o roteiro manual de `specs/001-user-auth/quickstart.md` contra o PostgreSQL local e registrar divergências

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende do Setup e bloqueia todas as histórias
- **US1 (Phase 3)**: depende da Foundational
- **US2 (Phase 4)**: depende da Foundational e reutiliza de US1 a entidade `User`, a migration 1, `UserRepository`, `IPasswordEncripter`, `IAccessTokenGenerator` e `ResponseRegisteredUserJson` (T023–T031, T026)
- **US3 (Phase 5)**: depende da Foundational e de US1 (entidade, repositório e gerador de token); independente de US2
- **Polish (Phase 6)**: depende das histórias desejadas

### User Story Dependencies

- **US1 (P1)**: nenhuma outra história
- **US2 (P1)**: peças de domínio/infra de US1, não do endpoint de cadastro (os testes semeiam a conta direto no banco)
- **US3 (P2)**: peças de US1; pode ser feita em paralelo com US2

### Within Each User Story

- Testes escritos e falhando antes da implementação
- Domain e Communication → Infrastructure → Application → Api
- Migration antes do repositório que a usa

### Parallel Opportunities

- T002, T003, T004 em paralelo após T001
- T005, T006, T007, T009, T010 em paralelo; T015–T017 em paralelo
- Em cada história, todas as tarefas de teste [P] em paralelo, e as tarefas [P] de Domain/Communication em paralelo
- Depois de US1, US2 e US3 podem seguir em paralelo

---

## Parallel Example: User Story 1

```text
# Testes de US1 juntos:
T020 RegisterUserValidatorTest
T021 RegisterUserUseCaseTest
T022 RegisterUserTest (integração)

# Contratos de domínio e comunicação juntos:
T023 User.cs
T024 IUserReadOnlyRepository / IUserWriteOnlyRepository
T025 IPasswordEncripter / IAccessTokenGenerator
T026 Requests/Responses de cadastro
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup
2. Phase 2 Foundational
3. Phase 3 US1
4. **Parar e validar**: cadastro testado de ponta a ponta; banco criado pelas migrations

### Incremental Delivery

1. Setup + Foundational → API sobe e cria o banco
2. US1 → cadastro (MVP)
3. US2 → login com bloqueio
4. US3 → perfil protegido por token
5. Polish → Swagger, `.http`, validação final

Cada incremento termina com todos os testes passando e um commit próprio.

---

## Notes

- [P] = arquivos diferentes, sem dependência pendente
- Mensagens ao usuário só via `ResourceMessagesException.resx`, nunca literais no código
- Segredos (connection string, chave JWT) só em user-secrets / variáveis de ambiente
- Commitar ao fim de cada fase ou grupo lógico (Conventional Commits)
