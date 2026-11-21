# Research: Cadastro e Login de Usuário

**Feature**: `001-user-auth` | **Date**: 2026-11-21

Decisões técnicas que a spec deixou para o plano. Cada item segue o padrão
Decision / Rationale / Alternatives considered.

## 1. Hash de senha

- **Decision**: BCrypt (`BCrypt.Net-Next`), work factor 12, encapsulado atrás de
  `IPasswordEncripter` (Domain) com implementação na Infrastructure.
- **Rationale**: algoritmo lento e com salt embutido, padrão de mercado para senhas;
  atende o princípio IV (hash adequado, nunca reversível). A interface isola a biblioteca
  e permite fake nos testes.
- **Alternatives considered**: SHA-512 com salt (usado nas primeiras versões do
  MyRecipeBook): rápido demais, vulnerável a força bruta offline. Argon2id: mais moderno,
  mas exige pacote nativo e mais configuração; ganho irrelevante nesta escala.
- **Consequência**: BCrypt considera só os primeiros 72 bytes da senha, então a validação
  limita a senha a no máximo 72 bytes em UTF-8 (teto de segurança previsto na spec).

## 2. Emissão e validação da credencial (JWT)

- **Decision**: JWT HS256 gerado com `System.IdentityModel.Tokens.Jwt`, contendo a claim
  `sid` com o `UserIdentifier` (Guid) e expiração configurável (padrão 10080 min = 7 dias).
  Validação por um filtro de autorização próprio (`[AuthenticatedUser]`), como no
  MyRecipeBook, que valida assinatura e expiração, confirma que a conta ainda existe e está
  ativa, e responde 401 com mensagem em português.
- **Rationale**: o filtro dá controle total da resposta de erro (FR-013) e cobre o caso
  "conta deixou de existir" da spec. `ILoggedUser` lê o usuário a partir do token para os
  use cases.
- **Alternatives considered**: middleware `JwtBearer` padrão: devolve 401 sem corpo e
  exigiria customizar `OnChallenge` e um passo extra para checar a existência da conta.
- **Configuração**: `Settings:Jwt:SigningKey` (mínimo 32 caracteres, só em user-secrets /
  variável de ambiente) e `Settings:Jwt:ExpirationTimeMinutes`.

## 3. Validação de entrada

- **Decision**: FluentValidation na Application, com mensagens vindas de
  `ResourceMessagesException.resx` (pt-BR) no projeto `Hozelo.Exception`. Use case executa o
  validador e, se falhar, lança `ErrorOnValidationException` com **todas** as mensagens.
- **Rationale**: exigido pela constitution; cobre FR-014 (todos os erros de uma vez).
- **Alternatives considered**: DataAnnotations: mensagens menos flexíveis e validação
  acoplada à camada web.

## 4. Mapeamento request ↔ entidade ↔ response

- **Decision**: mapeamento manual (construção explícita nos use cases).
- **Rationale**: só três contratos; evita dependência extra (YAGNI, princípio V).
  O AutoMapper usado no MyRecipeBook passou a ter licença comercial a partir da v15.
- **Alternatives considered**: AutoMapper, Mapster: reavaliar quando houver muitos
  contratos.

## 5. Acesso a dados e migrations

- **Decision**: EF Core com `Npgsql.EntityFrameworkCore.PostgreSQL` para leitura/escrita;
  esquema via FluentMigrator (`FluentMigrator.Runner.Postgres`). Na inicialização da API:
  (1) conecta no banco `postgres` com Dapper + Npgsql e cria o banco se não existir;
  (2) executa `MigrateUp`. Repositórios separados por intenção (`IUserReadOnlyRepository`,
  `IUserWriteOnlyRepository`) + `IUnitOfWork`, como no MyRecipeBook.
- **Rationale**: decisão registrada na constitution v1.1.0.
- **Alternatives considered**: EF Core Migrations: vetado pela constitution.

## 6. Garantia de conta única (FR-005) sob concorrência

- **Decision**: além da checagem no use case (`ExistsAnyUser`), índice único sobre
  expressão constante na tabela `users` (`CREATE UNIQUE INDEX ux_users_single_account ON
  users ((true))`). Uma violação na gravação é convertida em
  `AccountAlreadyExistsException`.
- **Rationale**: a checagem sozinha tem condição de corrida (edge case "dois cadastros
  simultâneos"); o índice garante no banco que nunca exista mais de uma linha.
- **Alternatives considered**: transação serializable (mais frágil e dependente de retry);
  lock em memória (não protege múltiplas instâncias).

## 7. Bloqueio por tentativas de login (FR-015)

- **Decision**: estado persistido em uma tabela de linha única `login_throttle`
  (`failed_attempts`, `locked_until_utc`), criada e semeada pela migration. Atualizações via
  `UPDATE` atômico no banco. Regras:
  - se `locked_until_utc > agora` → recusa com 429, sem alterar o estado;
  - falha (e-mail inexistente ou senha errada) → incrementa; ao chegar no limite, define
    `locked_until_utc = agora + duração` e zera a contagem;
  - sucesso → zera a contagem.
  Limite e duração em `Settings:LoginLockout` (padrão 5 e 15 min). Tempo obtido de
  `TimeProvider` para permitir testes determinísticos.
- **Rationale**: como só existe uma conta, o controle é global (decisão da spec); persistir
  no banco sobrevive a reinícios e funciona com mais de uma instância.
- **Alternatives considered**: contador em memória (perde estado a cada reinício);
  rate limiter do ASP.NET por IP (não atende a regra "5 erros seguidos").

## 8. Normalização de e-mail e nome

- **Decision**: e-mail com `Trim()` + `ToLowerInvariant()` antes de validar, gravar e
  consultar; nome com `Trim()`. Feito no use case antes do validador.
- **Rationale**: edge cases da spec; evita duplicidade por caixa.

## 9. Tratamento de erros

- **Decision**: hierarquia `HozeloException` (abstrata, com `GetErrorMessages()` e
  `GetStatusCode()`) no projeto `Hozelo.Exception`; `ExceptionFilter` global na Api converte
  em `ResponseErrorJson { errors: string[] }`. Exceção desconhecida → 500 com "Erro
  desconhecido." sem detalhes internos.

| Exceção | HTTP | Uso |
|---|---|---|
| `ErrorOnValidationException` | 400 | entrada inválida (lista de mensagens) |
| `InvalidLoginException` | 401 | e-mail e/ou senha inválidos |
| `UnauthorizedException` | 401 | credencial ausente, inválida, expirada ou de conta inexistente |
| `AccountAlreadyExistsException` | 409 | cadastro quando já existe conta |
| `TooManyLoginAttemptsException` | 429 | login bloqueado |

## 10. Estratégia de testes

- **Decision**:
  - `Validators.Tests` e `UseCases.Tests`: xUnit + Moq + Bogus + Shouldly; builders em
    `CommonTestUtilities` (requests, entidade, repositórios fake, `FakeTimeProvider`).
  - `WebApi.Tests`: `WebApplicationFactory<Program>` + **Testcontainers.PostgreSql**, rodando
    as migrations reais num PostgreSQL descartável; limpeza das tabelas entre testes.
- **Rationale**: o índice de expressão, o `UPDATE` atômico e o FluentMigrator não funcionam
  no provedor InMemory do EF Core; Testcontainers testa o comportamento real (Docker já
  disponível na máquina).
- **Alternatives considered**: EF InMemory (usado no MyRecipeBook): falsos positivos neste
  design. FluentAssertions: licença comercial a partir da v8, por isso Shouldly.
