# Data Model: Cadastro e Login de Usuário

**Feature**: `001-user-auth` | **Date**: 2026-11-21

Nomes de tabelas e colunas em inglês, `snake_case` no PostgreSQL. Datas em UTC
(`timestamptz`).

## Entidade base (`EntityBase`, Domain)

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| Id | `long` | `id bigint` identity PK | interno, nunca exposto na API |
| CreatedOn | `DateTime` (UTC) | `created_on timestamptz` | preenchido na criação |
| Active | `bool` | `active boolean` | padrão `true` |

## User (`users`)

Conta compartilhada da família. Existe no máximo uma linha.

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| UserIdentifier | `Guid` | `user_identifier uuid` | único, gerado na criação; vai na claim `sid` do token |
| Name | `string` | `name varchar(100)` | obrigatório, sem espaços nas pontas, 1–100 caracteres |
| Email | `string` | `email varchar(255)` | obrigatório, formato válido, minúsculo e sem espaços, único |
| Password | `string` | `password varchar(255)` | hash BCrypt; nunca exposto |

**Índices**

- `ux_users_user_identifier` único em `user_identifier`.
- `ux_users_email` único em `email`.
- `ux_users_single_account` único sobre `((true))`: garante uma única conta (FR-005).

**Validação de cadastro (FluentValidation)**

| Regra | Mensagem (pt-BR) |
|---|---|
| Nome vazio ou só espaços | "O nome não pode estar vazio." |
| Nome > 100 caracteres | "O nome deve ter no máximo 100 caracteres." |
| E-mail vazio | "O e-mail não pode estar vazio." |
| E-mail inválido | "O e-mail informado é inválido." |
| E-mail > 255 caracteres | "O e-mail deve ter no máximo 255 caracteres." |
| Senha vazia | "A senha não pode estar vazia." |
| Senha < 8 caracteres | "A senha deve ter no mínimo 8 caracteres." |
| Senha > 72 bytes (UTF-8) | "A senha é muito longa." |

Regras de negócio (no use case, após a validação de formato):

| Regra | Mensagem |
|---|---|
| Já existe conta (FR-005) | "Já existe uma conta cadastrada. Faça login para continuar." |

Ordem: a checagem de conta existente vem **antes** da validação de formato, para que ela
prevaleça (edge case da spec).

**Ciclo de vida**: criada uma única vez no cadastro; sem edição ou exclusão nesta feature.
`Active = false` faz o filtro de autenticação recusar o acesso (não há tela para desativar).

## LoginThrottle (`login_throttle`)

Controle global de tentativas de login (FR-015). Linha única, criada pela migration.

| Campo | Tipo C# | Coluna | Regras |
|---|---|---|---|
| Id | `int` | `id integer` PK | sempre `1` (check constraint `id = 1`) |
| FailedAttempts | `int` | `failed_attempts integer` | ≥ 0, padrão 0 |
| LockedUntilUtc | `DateTime?` | `locked_until_utc timestamptz null` | nulo quando não bloqueado |

**Transições de estado**

```text
Livre (attempts < limite, locked_until nulo ou passado)
  ── falha ──▶ attempts + 1
  ── falha que atinge o limite ──▶ Bloqueado (locked_until = agora + duração, attempts = 0)
  ── sucesso ──▶ attempts = 0
Bloqueado (locked_until > agora)
  ── qualquer tentativa ──▶ recusada com 429, estado inalterado
  ── tempo passa ──▶ Livre
```

Mensagem do bloqueio: "Muitas tentativas de login. Tente novamente em alguns minutos."

## Migrations (FluentMigrator)

| Versão | Conteúdo |
|---|---|
| 1 | tabela `users` com índices acima |
| 2 | tabela `login_throttle` + linha inicial `(1, 0, null)` |

As versões são constantes numéricas sequenciais (classe `DatabaseVersions`), como no
MyRecipeBook.
