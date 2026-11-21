# Data Model: Tela de Configurações

**Feature**: `006-frontend-settings` | **Date**: 2026-11-21

Sem dados novos no servidor. Tipos dos contratos consumidos, validações dos formulários e estado de
tela. Decisões em [research.md](research.md) (R§n).

## Tipos (`src/types/api.ts`)

```ts
type CategoryType = 'Expense' | 'Income'

interface ResponseCategory { id: number; name: string; type: CategoryType; entriesCount: number }
interface ResponseCategories { categories: ResponseCategory[] }
interface RequestCategory { name: string; type?: CategoryType }

interface ResponseOpeningBalance { amount: number; referenceDate: string } // "yyyy-MM-dd"
interface RequestOpeningBalance { amount: number; referenceDate: string }
```

## CategoryForm (Zod, `features/categories/schemas.ts`)

| Campo | Tipo | Regras | Mensagem |
|---|---|---|---|
| name | `string` | trim; obrigatório | "Informe o nome da categoria." |
| name | `string` | até 50 caracteres | "O nome deve ter no máximo 50 caracteres." |
| type | `'Expense' \| 'Income'` | obrigatório; fixo ao renomear | — |

## SuggestionsForm

| Campo | Tipo | Regras |
|---|---|---|
| selected | `string[]` | ao menos 1 para confirmar; padrão = todas as sugestões do tipo que ainda não existem |

Listas (R§6): despesa = Mercado, Moradia, Água, Luz, Internet, Transporte, Cartão de crédito, Saúde,
Lazer; receita = Salário, 13º salário, Vendas, Outros.

## OpeningBalanceForm (Zod, `features/opening-balance/schemas.ts`)

| Campo | Tipo | Regras | Mensagem |
|---|---|---|---|
| amount | `number` | ≥ 0, 2 casas (vem do `MoneyInput`) | — |
| negative | `boolean` | padrão `false` (ou `amount < 0` ao alterar) | — |
| referenceDate | `string` `"yyyy-MM-dd"` | obrigatório; padrão dia 1º do mês atual na primeira vez | "Informe a data de referência." |

Envio: `{ amount: negative ? -amount : amount, referenceDate }`.

## Estado da tela

| Seção | Estados |
|---|---|
| Categorias (por tipo) | carregando (esqueleto) · erro (mensagem + "Tentar novamente") · vazio (estado vazio + "Nova categoria" + "Usar sugestões") · lista |
| Saldo inicial | carregando · erro · não informado (aviso + "Informar saldo inicial") · informado (valor, data, "Alterar") |
| Conta | carregando · nome e e-mail |

## Chaves de cache (`src/lib/query-keys.ts`)

| Chave | Dado | Invalidada por |
|---|---|---|
| `['categories', type]` | lista do tipo | criar, renomear, remover, sugestões (`['categories']`) |
| `['opening-balance']` | saldo inicial ou `null` | salvar saldo inicial |
| `['profile']` | nome e e-mail | — |
