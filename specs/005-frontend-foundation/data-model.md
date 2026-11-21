# Data Model: Fundação do Frontend (Acesso e Navegação)

**Feature**: `005-frontend-foundation` | **Date**: 2026-11-21

Esta feature não cria dados no servidor. Os modelos abaixo são estado do cliente e tipos dos
contratos consumidos. Decisões em [research.md](research.md) (R§n).

## Session (estado do cliente)

| Campo | Tipo | Regras |
|---|---|---|
| accessToken | `string` | JWT devolvido por `POST /login` ou `POST /users`; enviado em `Authorization: Bearer` |
| accountName | `string` | nome da conta para o menu; vem da resposta de entrar/cadastrar e é atualizado pelo perfil |
| persistent | `boolean` | `true` = "Manter conectado" marcado (localStorage); `false` = sessionStorage (R§1) |
| expiresAt | `number` (epoch s) | lido do `exp` do JWT; sessão vencida é descartada ao iniciar (R§2) |

**Armazenamento**: chave única `hozelo.session` com `{ accessToken, accountName }` em
`localStorage` (persistente) ou `sessionStorage` (não persistente). Leitura nos dois; gravação limpa
o outro; sair limpa os dois.

**Transições**

```text
Sem sessão ── entrar/cadastrar ok ──▶ Conectado
Conectado  ── Sair ──▶ Sem sessão (cache de dados limpo)
Conectado  ── 401 em requisição com token ──▶ Sem sessão + aviso "Sua sessão expirou..." (R§3)
Conectado  ── exp vencido ao abrir o app ──▶ Sem sessão
```

## NavArea (configuração)

| Campo | Tipo | Regras |
|---|---|---|
| key | `'summary' \| 'expenses' \| 'incomes' \| 'fixedBills' \| 'people' \| 'settings'` | identificador |
| label | `string` | "Resumo do mês", "Despesas", "Receitas", "Contas fixas", "Pessoas", "Configurações" |
| path | `string` | `/`, `/despesas`, `/receitas`, `/contas-fixas`, `/pessoas`, `/configuracoes` |
| icon | ícone Lucide | ex.: `LayoutDashboard`, `Receipt`, `TrendingUp`, `Repeat`, `Users`, `Settings` |
| primaryOnMobile | `boolean` | `true` para Resumo, Despesas, Receitas, Pessoas (barra do rodapé); demais no "Mais" |

## Tipos dos contratos consumidos (`src/types/api.ts`)

```ts
interface RequestLogin { email: string; password: string }
interface RequestRegisterUser { name: string; email: string; password: string }
interface ResponseRegisteredUser { name: string; tokens: { accessToken: string } }
interface ResponseUserProfile { name: string; email: string }
interface ResponseError { errors: string[] }
```

## Validação dos formulários (Zod, `features/auth/schemas.ts`)

| Formulário | Campo | Regra | Mensagem |
|---|---|---|---|
| Entrar | email | obrigatório | "Informe o e-mail." |
| Entrar | email | formato válido | "Informe um e-mail válido." |
| Entrar | password | obrigatório | "Informe a senha." |
| Entrar | keepSignedIn | booleano, padrão `true` | — |
| Cadastro | name | obrigatório (após trim) | "Informe o nome." |
| Cadastro | name | até 100 | "O nome deve ter no máximo 100 caracteres." |
| Cadastro | email | obrigatório / válido | "Informe o e-mail." / "Informe um e-mail válido." |
| Cadastro | password | obrigatório / mínimo 8 | "Informe a senha." / "A senha deve ter no mínimo 8 caracteres." |

## Valores dos componentes compartilhados

| Componente | Valor | Regras |
|---|---|---|
| MoneyInput | `number` (2 casas) | internamente em centavos inteiros; 0 a 9.999.999.999,99 (R§11) |
| MonthPicker | `string` `"yyyy-MM"` | de `"2000-01"` a `"2100-12"` (R§12) |
