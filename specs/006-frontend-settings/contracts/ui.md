# UI Contract: Tela de Configurações

**Feature**: `006-frontend-settings`

## Rota

| Caminho | Tela | Título da aba |
|---|---|---|
| `/configuracoes` | Configurações (substitui "em construção") | Configurações · Hozelo |

Todas as rotas passam a ser carregadas sob demanda (R§9).

## API consumida

| Chamada | Uso | Tratamento |
|---|---|---|
| `GET /api/categories?type=Expense\|Income` | lista por tipo | erro → mensagem + "Tentar novamente" |
| `POST /api/categories` `{ name, type }` | criar / sugestões | 201 → aviso; 400/409 → mensagem da API no formulário |
| `PUT /api/categories/{id}` `{ name }` | renomear | 204 → aviso; 400/404/409 → mensagem no formulário |
| `DELETE /api/categories/{id}` | remover | 204 → aviso; 409 (com lançamentos)/404 → mensagem no diálogo |
| `GET /api/opening-balance` | saldo inicial | 404 → "não informado" (não é erro) |
| `PUT /api/opening-balance` `{ amount, referenceDate }` | informar/alterar | 200 → aviso; 400 → mensagem no formulário |
| `GET /api/users` | conta (nome e e-mail) | já usado pela 005 |

## Avisos de sucesso

| Ação | Aviso |
|---|---|
| Criar | "Categoria criada." |
| Renomear | "Categoria renomeada." |
| Remover | "Categoria removida." |
| Sugestões | "N categorias criadas." (1 → "1 categoria criada.") |
| Saldo inicial | "Saldo inicial salvo." |

## Componentes compartilhados novos (`src/components/shared`)

```tsx
<ResponsiveDialog open={open} onOpenChange={setOpen} title="Nova categoria" description="...">
  {/* conteúdo; rodapé com <ResponsiveDialogFooter> */}
</ResponsiveDialog>
// Dialog centralizado a partir de 768 px; Sheet vindo de baixo abaixo disso.

<PageLoader />            // indicador enquanto uma tela é baixada
<RouteErrorBoundary>…</RouteErrorBoundary>  // "Não foi possível carregar esta tela." + "Tentar de novo"
```

## Utilitários novos

| Nome | Onde | Uso |
|---|---|---|
| `pluralize(n, singular, plural, zero?)` | `lib/format.ts` | "Nenhum lançamento", "1 lançamento", "3 lançamentos" |
| `useMediaQuery(query)` | `lib/use-media-query.ts` | painel responsivo |
| `queryKeys` | `lib/query-keys.ts` | chaves de cache compartilhadas |
