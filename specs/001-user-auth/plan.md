# Implementation Plan: Cadastro e Login de Usuário

**Branch**: `001-user-auth` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-user-auth/spec.md`

## Summary

Primeira feature com persistência do Hozelo: cadastro da conta única da família (permitido só
enquanto não existe conta), login com e-mail e senha devolvendo JWT válido por 7 dias,
bloqueio global de 15 minutos após 5 erros seguidos e consulta do perfil autenticado.
Também estabelece a fundação técnica que as próximas features reutilizam: criação automática
do banco + FluentMigrator, EF Core com PostgreSQL, hierarquia de exceções com mensagens
pt-BR, filtro global de erros, filtro de autenticação e infraestrutura de testes
(builders, fakes e Testcontainers). Detalhes das decisões em [research.md](research.md).

## Technical Context

**Language/Version**: C# 14 / .NET 10 (`net10.0`), nullable habilitado

**Primary Dependencies**: ASP.NET Core Web API (controllers), EF Core +
Npgsql.EntityFrameworkCore.PostgreSQL, FluentMigrator.Runner.Postgres, Dapper (criação do
banco), FluentValidation, BCrypt.Net-Next, System.IdentityModel.Tokens.Jwt, Swashbuckle

**Storage**: PostgreSQL 17 (container Docker local, porta 5433)

**Testing**: xUnit, Moq, Bogus, Shouldly, Microsoft.AspNetCore.Mvc.Testing
(`WebApplicationFactory`), Testcontainers.PostgreSql,
Microsoft.Extensions.TimeProvider.Testing (`FakeTimeProvider`)

**Target Platform**: servidor Linux/Windows rodando a API (desenvolvimento local no Windows)

**Project Type**: web-service (REST API); frontend fora de escopo

**Performance Goals**: uso familiar (1 conta, poucos usuários simultâneos); login e cadastro
respondem em menos de 1 s localmente, dominado pelo custo intencional do BCrypt

**Constraints**: mensagens ao usuário em pt-BR via resources; segredos fora do repositório;
datas em UTC; no máximo uma conta no banco

**Scale/Scope**: 1 conta, 3 endpoints, 2 tabelas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação | Status |
|---|---|---|
| I. DDD e camadas | Entidades e interfaces de repositório no Domain; use cases e validadores na Application; EF, FluentMigrator, BCrypt e JWT na Infrastructure; controllers finos; contratos em Communication; exceções e resources em Exception | ✅ |
| II. Clean Code e idioma | Código e banco em inglês; mensagens pt-BR em `ResourceMessagesException.resx` | ✅ |
| III. Testes obrigatórios | Testes de validators, use cases e integração para os 3 endpoints; builders em CommonTestUtilities | ✅ |
| IV. Segurança e dados | JWT em tudo exceto cadastro/login; BCrypt; segredos em user-secrets; UTC; validação antes de persistir; filtro de exceções sem stack trace; mensagem de login não revela e-mail | ✅ |
| V. Simplicidade | Mapeamento manual em vez de AutoMapper; sem refresh token; documentos e frontend fora | ✅ |
| Stack | .NET 10, PostgreSQL, EF Core para dados, FluentMigrator para esquema, FluentValidation, xUnit, Swagger | ✅ |
| Novas dependências justificadas | Ver tabela abaixo | ✅ |

**Dependências NuGet novas**

| Pacote | Projeto | Justificativa |
|---|---|---|
| FluentValidation | Application | exigido pela constitution |
| Npgsql.EntityFrameworkCore.PostgreSQL | Infrastructure | EF Core + PostgreSQL |
| FluentMigrator.Runner.Postgres | Infrastructure | migrations (constitution v1.1.0) |
| Dapper | Infrastructure | criar o banco se não existir (FluentMigrator não cria) |
| BCrypt.Net-Next | Infrastructure | hash de senha |
| System.IdentityModel.Tokens.Jwt | Infrastructure | gerar/validar JWT |
| Moq, Bogus, Shouldly | testes | fakes, dados de teste e asserções |
| Microsoft.AspNetCore.Mvc.Testing, Testcontainers.PostgreSql | WebApi.Tests | integração com banco real |
| Microsoft.Extensions.TimeProvider.Testing | testes | controlar o tempo (expiração e bloqueio) |

**Re-check pós-design**: ✅ nenhuma violação; a seção Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/001-user-auth/
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
│   │   │   ├── Controllers/        # UsersController (POST, GET), LoginController
│   │   │   ├── Filters/            # ExceptionFilter, AuthenticatedUserFilter
│   │   │   ├── Attributes/         # [AuthenticatedUser]
│   │   │   ├── Token/              # leitura do token do header
│   │   │   └── Program.cs          # DI, filtros, migrations na inicialização
│   │   ├── Hozelo.Application/
│   │   │   ├── UseCases/User/Register/      # IRegisterUserUseCase, validator
│   │   │   ├── UseCases/User/Profile/       # IGetUserProfileUseCase
│   │   │   ├── UseCases/Login/DoLogin/      # IDoLoginUseCase
│   │   │   └── DependencyInjectionExtension.cs
│   │   ├── Hozelo.Domain/
│   │   │   ├── Entities/           # EntityBase, User, LoginThrottle
│   │   │   ├── Repositories/       # IUnitOfWork, User/*, LoginThrottle/*
│   │   │   ├── Security/           # IPasswordEncripter, IAccessTokenGenerator, IAccessTokenValidator
│   │   │   └── Services/           # ILoggedUser
│   │   └── Hozelo.Infrastructure/
│   │       ├── DataAccess/         # HozeloDbContext, UnitOfWork, repositories
│   │       ├── Migrations/         # DatabaseMigration, DatabaseVersions, Versions/
│   │       ├── Security/           # BCrypt, JWT generator/validator
│   │       ├── Services/           # LoggedUser
│   │       └── DependencyInjectionExtension.cs
│   └── Shared/
│       ├── Hozelo.Communication/
│       │   ├── Requests/           # RequestRegisterUserJson, RequestLoginJson
│       │   └── Responses/          # ResponseRegisteredUserJson, ResponseTokensJson,
│       │                           # ResponseUserProfileJson, ResponseErrorJson
│       └── Hozelo.Exception/
│           ├── ExceptionsBase/     # HozeloException e derivadas
│           └── ResourceMessagesException.resx
└── tests/
    ├── CommonTestUtilities/        # builders de requests/entidades, repositórios e serviços fake
    ├── Validators.Tests/           # RegisterUserValidatorTest
    ├── UseCases.Tests/             # Register, DoLogin, GetProfile
    └── WebApi.Tests/               # factory + Testcontainers, testes por endpoint
```

**Structure Decision**: mantém a solution em camadas já existente em `backend/`; esta feature
só adiciona pastas dentro dos projetos atuais, sem criar projetos novos.

## Ordem de implementação (insumo para /speckit-tasks)

1. **Fundação**: exceções + resources pt-BR, `ResponseErrorJson`, `ExceptionFilter`,
   `EntityBase`, `HozeloDbContext`, `UnitOfWork`, criação do banco + FluentMigrator rodando
   no `Program.cs`, configuração via user-secrets, base dos testes (factory + Testcontainers).
2. **US1 Cadastro (P1)**: migration 1 (`users`), entidade, repositórios, validator, BCrypt,
   gerador de JWT, use case, `POST /users`, testes.
3. **US2 Login (P1)**: migration 2 (`login_throttle`), repositório de throttle, use case com
   regras de bloqueio usando `TimeProvider`, `POST /login`, testes.
4. **US3 Perfil (P2)**: validador de JWT, `AuthenticatedUserFilter` + atributo,
   `ILoggedUser`, use case, `GET /users`, testes.
5. **Acabamento**: Swagger com esquema Bearer, `Hozelo.Api.http` com os cenários, roteiro do
   [quickstart.md](quickstart.md).

## Complexity Tracking

Não se aplica: nenhuma violação da constitution.
