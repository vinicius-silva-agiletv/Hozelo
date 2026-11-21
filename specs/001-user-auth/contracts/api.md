# API Contract: Cadastro e Login de Usuário

**Feature**: `001-user-auth` | Base: `/` | JSON em `camelCase` | Rotas em minúsculas

Todas as respostas de erro usam o mesmo formato:

```json
{ "errors": ["mensagem em português", "..."] }
```

Contratos C# ficam em `Hozelo.Communication` (`Requests/` e `Responses/`).

---

## POST `/users`: cadastrar a conta da família

Público (sem token).

**Request** (`RequestRegisterUserJson`)

```json
{ "name": "Família Silva", "email": "familia@exemplo.com", "password": "senha1234" }
```

**Responses**

| Status | Corpo | Quando |
|---|---|---|
| 201 Created | `ResponseRegisteredUserJson` | conta criada |
| 400 Bad Request | `ResponseErrorJson` com **todas** as mensagens de validação | dados inválidos |
| 409 Conflict | `["Já existe uma conta cadastrada. Faça login para continuar."]` | já existe conta (prevalece sobre 400) |

```json
// ResponseRegisteredUserJson
{
  "name": "Família Silva",
  "tokens": { "accessToken": "eyJhbGciOi..." }
}
```

---

## POST `/login`: entrar na conta

Público (sem token).

**Request** (`RequestLoginJson`)

```json
{ "email": "familia@exemplo.com", "password": "senha1234" }
```

**Responses**

| Status | Corpo | Quando |
|---|---|---|
| 200 OK | `ResponseRegisteredUserJson` (mesmo formato do cadastro) | credenciais corretas |
| 401 Unauthorized | `["E-mail e/ou senha inválidos."]` | e-mail inexistente ou senha errada (mensagem idêntica) |
| 429 Too Many Requests | `["Muitas tentativas de login. Tente novamente em alguns minutos."]` | login bloqueado |

Campos vazios no login também retornam 401 com a mensagem genérica (sem validação
detalhada, para não ajudar quem tenta adivinhar credenciais).

---

## GET `/users`: perfil da conta autenticada

Protegido: header `Authorization: Bearer <accessToken>`.

**Responses**

| Status | Corpo | Quando |
|---|---|---|
| 200 OK | `ResponseUserProfileJson` | token válido |
| 401 Unauthorized | `["É necessário estar autenticado para acessar este recurso."]` | sem token |
| 401 Unauthorized | `["Sessão inválida ou expirada. Faça login novamente."]` | token inválido, adulterado, expirado ou de conta inexistente/inativa |

```json
// ResponseUserProfileJson
{ "name": "Família Silva", "email": "familia@exemplo.com" }
```

Nunca contém senha, hash, `id` interno ou `userIdentifier`.

---

## Credencial de acesso (JWT)

| Item | Valor |
|---|---|
| Algoritmo | HS256 |
| Claim de identidade | `sid` = `UserIdentifier` (Guid) |
| Expiração | `Settings:Jwt:ExpirationTimeMinutes` (padrão 10080 = 7 dias) |
| Renovação | não há nesta versão |
