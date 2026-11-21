# Research: Tela de Configurações

**Feature**: `006-frontend-settings` | **Date**: 2026-11-21

Decisões técnicas (Decision / Rationale / Alternatives). Base: feature 005 (layout, sessão, cliente
HTTP, `PageHeader`, `EmptyState`, `MoneyInput`, `ConfirmDialog`, `ApiErrorAlert`).

## 1. Organização por feature

- **Decision**: três features novas, conforme constitution I:
  - `features/categories` (api, hooks, schemas, `suggestions.ts`, componentes da seção);
  - `features/opening-balance` (api, hooks, schema, componentes da seção);
  - `features/settings` (só a página `settings-page.tsx`, que compõe as seções).
  A página importa os componentes públicos de cada feature; uma feature não importa internos de
  outra.
- **Alternatives considered**: tudo em `features/settings` (misturaria categorias, que serão usadas
  nas telas de despesas e receitas, com a página de configurações).

## 2. Chaves de cache (TanStack Query)

- **Decision**: `src/lib/query-keys.ts` centraliza as chaves: `['categories', type]`,
  `['opening-balance']`, `['profile']`. Mutações de categoria invalidam `['categories']` (os dois
  tipos e as contagens); a de saldo inicial invalida `['opening-balance']`.
- **Rationale**: as próximas features (despesas, resumo) vão invalidar as mesmas chaves; chave
  centralizada evita divergência (SC-004).

## 3. Saldo inicial inexistente

- **Decision**: `GET /opening-balance` responde 404 quando não há saldo; a função da API converte o
  404 em `null` (o hook devolve `data: null`, não erro).
- **Rationale**: "não informado" é um estado normal da tela, não falha.

## 4. Painel de formulário responsivo

- **Decision**: componente compartilhado `ResponsiveDialog` (`components/shared`): `Dialog` do
  shadcn/ui a partir de 768 px e `Sheet` vindo de baixo abaixo disso, decidido por um hook
  `useMediaQuery('(min-width: 768px)')` em `src/lib`. Mesma API para os dois (título, descrição,
  conteúdo, rodapé). Adicionar o componente `dialog` do shadcn/ui já existente; nada novo.
- **Rationale**: FR-011; reutilizável nas telas de despesas/receitas.
- **Alternatives considered**: só `Dialog` (fica apertado no celular); biblioteca `vaul` (drawer)
  — dependência nova sem necessidade.

## 5. Formulários

- **Decision**: React Hook Form + Zod, como na 005. Categoria: `name` (trim, 1–50) e `type`
  (`Expense` | `Income`, escolhido por botões de opção; desabilitado ao renomear). Saldo inicial:
  `amount` (`MoneyInput`, ≥ 0), `negative` (`Switch` "Saldo negativo") e `referenceDate`
  (`<input type="date">` nativo, obrigatório). Enviado à API como `amount = negative ? -amount :
  amount`.
- **Data**: input nativo de data (teclado/seletor nativo no celular, acessível, sem dependência);
  o componente `calendar` do shadcn/ui fica para filtros futuros.
- **Data padrão**: dia 1º do mês atual (`currentMonth() + '-01'`), clarify Q2.

## 6. Sugestões de categorias

- **Decision**: `features/categories/suggestions.ts` com as listas por tipo (clarify Q1). O diálogo
  mostra checkboxes, todas marcadas; ao confirmar, cria em sequência com `Promise.allSettled` de
  `POST /categories` (uma chamada por nome, para manter a validação e as mensagens da API por item).
  Resultado: aviso "N categorias criadas." e, para as que falharam, a lista "Nome: mensagem da API".
  Sugestões cujo nome já existe no tipo aparecem desmarcadas e com a indicação "já existe".
- **Rationale**: sem endpoint novo no backend (constitution V); a API já valida cada nome.
- **Alternatives considered**: endpoint de criação em lote (mudaria o backend sem necessidade).

## 7. Remoção com confirmação

- **Decision**: `ConfirmDialog` (005) com `destructive`; o diálogo fica aberto durante a remoção e
  mostra o erro da API dentro dele (ex.: 409 categoria com lançamentos); fecha só em sucesso.
- **Rationale**: FR-005 (categoria continua na lista e a mensagem aparece junto da ação).

## 8. Pluralização da contagem

- **Decision**: utilitário `pluralize(count, 'lançamento', 'lançamentos')` em `lib/format.ts`;
  zero → "Nenhum lançamento".

## 9. Carregamento sob demanda (divisão de código)

- **Decision**: `React.lazy` + `Suspense` em `app/router.tsx` para todas as páginas (entrar,
  cadastro, configurações, em construção, 404). Fallback `PageLoader` (esqueleto/spinner) dentro do
  layout, mantendo o menu visível. Falha ao baixar uma tela (chunk) é capturada por
  `RouteErrorBoundary` (`components/shared`), que mostra "Não foi possível carregar esta tela." e
  "Tentar de novo" (recarrega a página).
- **Meta SC-005**: pacote inicial da 005 = 563 kB (177 kB gzip). Medir com `npm run build` antes/depois.
- **Rationale**: as libs de formulário (React Hook Form, Zod) e telas deixam de estar no pacote da
  tela de entrada… exceto as usadas pela própria entrada; o maior ganho vem de telas e componentes
  que só a área conectada usa.
- **Alternatives considered**: `manualChunks` por biblioteca (ajuda no cache, mas não reduz o que é
  necessário para abrir a primeira tela).

## 10. Testes

- **Decision**: o `mockApi` da 005 passa a aceitar chaves com query string
  (`"GET /categories?type=Expense"`) e funções que recebem o corpo enviado. Testes de: página
  (seções, carregamento, erro com "Tentar novamente"), categorias (listar por tipo, plural, criar,
  409, renomear, remover com/sem lançamentos, estado vazio, sugestões com falha parcial), saldo
  inicial (não informado, informar com data padrão, negativo, alterar), conta, `ResponsiveDialog`,
  `RouteErrorBoundary` e carregamento sob demanda (fallback aparece).

## 11. Dependências

- **Decision**: nenhuma dependência npm nova; componentes shadcn/ui necessários (`dialog`, `sheet`,
  `switch`, `checkbox`, `skeleton`, `tabs`, `dropdown-menu`) já estão no projeto; adicionar
  `radio-group` pelo CLI se usado para o tipo.
