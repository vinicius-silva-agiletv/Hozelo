# Quickstart: validar Cadastro e Login

**Feature**: `001-user-auth`

Roteiro para provar, de ponta a ponta, que a feature funciona. Detalhes de contrato em
[contracts/api.md](contracts/api.md) e de dados em [data-model.md](data-model.md).

## Pré-requisitos

- .NET 10 SDK.
- Docker Desktop aberto (banco local e testes de integração com Testcontainers).
- Container PostgreSQL local rodando na porta 5433:

```powershell
docker start hozelo-postgres
```

## Configurar segredos (uma vez)

Na pasta `backend/src/Backend/Hozelo.Api`:

```powershell
dotnet user-secrets init
```
```powershell
dotnet user-secrets set "ConnectionStrings:Connection" "Host=localhost;Port=5433;Database=hozelo;Username=postgres;Password=<sua-senha>"
```
```powershell
dotnet user-secrets set "Settings:Jwt:SigningKey" "<chave-aleatoria-com-32-ou-mais-caracteres>"
```

## Rodar os testes

Na pasta `backend`:

```powershell
dotnet test
```

Esperado: todos os testes de `Validators.Tests`, `UseCases.Tests` e `WebApi.Tests` passam.

## Rodar a API

```powershell
dotnet run --project src/Backend/Hozelo.Api
```

Esperado na primeira execução: o banco `hozelo` é criado e as tabelas `users`,
`login_throttle` e `VersionInfo` aparecem (confira pela extensão do VS Code).

## Cenários manuais (Swagger ou `Hozelo.Api.http`)

| # | Ação | Resultado esperado | Spec |
|---|---|---|---|
| 1 | `POST /users` com nome, e-mail e senha válidos | 201, nome + `accessToken` | US1-1 |
| 2 | Repetir o cadastro com outro e-mail | 409, "Já existe uma conta cadastrada..." | US1-2 |
| 3 | `GET /users` com o token do passo 1 | 200, nome e e-mail | US3-1 |
| 4 | `GET /users` sem token | 401, mensagem em português | US3-2 |
| 5 | `POST /login` com credenciais corretas | 200, novo `accessToken` | US2-1 |
| 6 | `POST /login` com senha errada e depois com e-mail inexistente | 401, mesma mensagem nos dois | US2-2, US2-3 |
| 7 | Errar a senha 5 vezes seguidas e então tentar com a senha certa | 429, "Muitas tentativas..." | US2-4 |
| 8 | Aguardar 15 minutos e entrar com a senha certa | 200 | US2-5 |

Para validar cadastro com dados inválidos (US1-3, US1-4) é preciso um banco sem conta: os
testes de integração cobrem esse caso; manualmente, apague a linha de `users`.
