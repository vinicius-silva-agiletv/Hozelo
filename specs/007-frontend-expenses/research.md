# Research: Tela de Despesas

**Feature**: `007-frontend-expenses` | **Date**: 2026-11-21

Decisões técnicas (Decision / Rationale / Alternatives). Base: 005 (sessão, cliente HTTP,
`MonthPicker`, `MoneyInput`, `ConfirmDialog`, `EmptyState`, `ApiErrorAlert`) e 006 (painel
responsivo, `queryKeys`, `useCategories`, rotas sob demanda, `categoriesStore` nos testes).

## 1. Organização por feature

- **Decision**:
  - `features/expenses`: `api.ts`, `hooks.ts`, `schemas.ts`, `preview.ts` (prévias de cálculo),
    `use-expenses-url.ts` (estado no endereço), `components/` e `pages/expenses-page.tsx`.
  - `features/people`: só `api.ts` e `hooks.ts` com `usePeople()` (lista para o seletor); a feature
    de Pessoas vai crescer a partir daqui.
  - Categorias vêm de `useCategories('Expense')` (hook público da 006).
- **Alternatives considered**: buscar pessoas dentro de `features/expenses` (duplicaria quando a
  tela de Pessoas chegar).

## 2. Estado no endereço

- **Decision**: `useSearchParams` com `aba` (`mes` | `todas`; padrão `mes`), `mes` (`yyyy-MM`;
  padrão mês atual), `categoria` (id), `situacao` (`abertas` | `quitadas`) e `despesa` (id do
  detalhe aberto). Valores inválidos são ignorados (mês fora de 2000-01..2100-12 → mês atual;
  categoria inexistente → todas). Trocar mês/filtro usa `replace` (não enche o histórico); abrir o
  detalhe usa `push`, então "voltar" no celular fecha o detalhe.
- **Rationale**: FR-002 e clarify Q2 (aba no endereço); link recarregável/compartilhável.
- **Alternatives considered**: estado local (perde-se ao recarregar).

## 3. Chaves de cache e atualização

- **Decision**: novas chaves em `lib/query-keys.ts`: `['installments', month, categoryId]`,
  `['expenses', {categoryId, status}]`, `['expense', id]`, `['people']`.
  - Pagar, desfazer e amortizar devolvem a despesa atualizada: grava em `['expense', id]` e
    invalida `['installments']` e `['expenses']`.
  - Cadastrar, editar e remover: invalida `['installments']`, `['expenses']`, `['categories']`
    (contagem de lançamentos) e remove/atualiza `['expense', id]`.
- **Rationale**: SC-003 — totais sempre vindos da API; FR-016.

## 4. Marcar como pago

- **Decision**: a caixa da parcela muda na hora (atualização otimista só do `isPaid` daquela
  linha) e fica desabilitada enquanto a chamada está em andamento; os totais só mudam com a
  resposta (refetch). Em erro, volta ao estado anterior e mostra a mensagem num aviso de erro.
  Desfazer parcela com `prepaid` (amortizada) abre `ConfirmDialog` antes. "Pagar em outra data"
  fica no menu da linha e abre um painel com `<input type="date">` (máximo hoje).
- **Rationale**: SC-002 (um toque, resposta rápida) sem calcular totais na tela (SC-003); clique
  duplo não envia duas vezes (Edge Cases).
- **Alternatives considered**: recalcular totais localmente (divergiria da API em antecipadas).

## 5. Prévias de cálculo (`preview.ts`)

- **Decision**: funções puras, em centavos, espelhando as regras da 002:
  - `splitInstallments(totalCents, count)` → valor da parcela e da última (sobra na última);
  - `totalFromInstallment(cents, count)`;
  - `installmentDueDate(first, n)` → mesmo dia do mês ou último dia;
  - `suggestedPaidCount(first, count, today)` → parcelas com vencimento antes do mês atual
    (clarify Q3, FR-018);
  - `defaultFirstDueDate(viewMonth, today)` → dia de hoje no mês aberto, limitado ao último dia
    (clarify Q4);
  - `amortizationPreview(installments, paidCents)` → soma e desconto;
  - `personShare(installmentCents, percent)` → parte da pessoa por parcela, arredondada ao
    centavo.
- **Rationale**: FR-008/FR-011/FR-013 pedem prévia antes de salvar; depois de salvar valem os
  valores da API (Assumptions). Não substitui cálculo do servidor (constitution: cálculo
  financeiro no backend) — é só exibição.

## 6. Formulário da despesa

- **Decision**: React Hook Form + Zod, num `ResponsiveDialog`:
  - à vista/parcelado e modo de valor (total/parcela) como grupos de opções (mesmo padrão do tipo
    de categoria na 006);
  - categoria com o `Select` do shadcn/ui (só despesas); sem categorias, aviso com link para
    `/configuracoes` (US3-8);
  - primeiro vencimento com `<input type="date">`;
  - "parcelas já pagas": sugestão automática até a família editar o campo (`dirtyFields`); não
    aparece na edição (a API não aceita esse campo no `PUT`);
  - "Dividir com uma pessoa": interruptor que mostra pessoa (`Select`) e parte (integral ou
    percentual 1–100); sem pessoas, texto explicando a área Pessoas.
  - O resumo (FR-008) aparece logo acima dos botões e se atualiza enquanto a família digita.
- **Alternatives considered**: assistente em etapas (mais toques; SC-001 pede < 45 s).

## 7. Detalhe da despesa

- **Decision**: `ExpenseDetailSheet` no `ResponsiveDialog` (largura maior no computador), aberto
  por `?despesa=id`: dados, totais (pago, desconto, restante), ações (Editar, Amortizar, Remover) e
  a lista de parcelas com caixa de pago. A lista de até 480 parcelas rola dentro do painel; não usa
  virtualização (480 linhas simples ficam leves).
- **Rationale**: FR-006, Edge Cases (muitas parcelas, despesa removida → fecha e atualiza).

## 8. Amortização

- **Decision**: painel com dois modos — "As últimas" (quantidade, 1 até as em aberto) e "Escolher"
  (caixas nas parcelas em aberto) —, data (máximo hoje; padrão hoje) e valor pago (`MoneyInput`,
  padrão a soma escolhida). Prévia "N parcelas · R$ soma · desconto de R$ X" (FR-011). Envia
  `quantity` ou `installmentNumbers`.

## 9. Visões e componentes

- **Decision**: `Tabs` (Mês | Todas) controladas pelo endereço.
  - Mês: `MonthPicker`, filtro de categoria, cartões de totais e a lista de parcelas (linha com
    caixa, data, nome, categoria, n/total, valor, marcas "antecipada"/"amortizada", menu com "Pagar
    em outra data"); tocar na linha abre o detalhe.
  - Todas: filtros de categoria e situação, totais pago/restante e cartões de despesa (situação,
    pagas/total, pago, restante, próximo vencimento, pessoa).
- **Rationale**: clarify Q2; mesma linguagem visual da 006.

## 10. Datas

- **Decision**: utilitários em `lib/date.ts`: `todayIso()` (data local, sem fuso), `isAfterToday`,
  `lastDayOfMonth`, `addMonthsToDate` (com limite no último dia). Datas trafegam como
  `"yyyy-MM-dd"`; exibição com `formatDate` (005).

## 11. Testes

- **Decision**: `test/expenses-store.ts` — despesas em memória que respondem `GET /installments`,
  `GET /expenses`, `GET /expenses/{id}`, `POST/PUT/DELETE /expenses`, pagamento, desfazer e
  amortização com as regras essenciais (geração de parcelas, totais, antecipadas), para testar os
  fluxos de ponta a ponta sem a API. Testes de `preview.ts` cobrem as regras de centavos e datas.

## 12. Dependências

- **Decision**: nenhuma dependência npm nova; `select`, `tabs`, `checkbox`, `dropdown-menu`,
  `switch` e `badge` do shadcn/ui já existem.
