# Research: Tela de Pessoas

**Feature**: `009-frontend-people` | **Date**: 2026-11-21

Decisões técnicas (Decision / Rationale / Alternatives). Base: 005–008 (sessão, cliente HTTP,
`MonthPicker`, `MoneyInput`, `ResponsiveDialog`, `ConfirmDialog`, `NativeSelect`, estado no
endereço, `usePeople` da 007, `financeStore`/`expensesStore` nos testes).

## 1. Organização por feature

- **Decision**: `features/people` (já tem `api.ts`/`hooks.ts` com `usePeople`) cresce com schemas,
  componentes e duas páginas: `pages/people-page.tsx` (`/pessoas`) e `pages/person-page.tsx`
  (`/pessoas/:id`). A rota nova entra em `app/router.tsx` sob o mesmo layout; o menu continua
  destacando "Pessoas" nas duas (o `NavLink` de `/pessoas` casa com `/pessoas/:id`).
- **Alternatives considered**: detalhe em painel sobre a lista (descartado na clarify Q1).

## 2. Fonte dos dados

- **Decision**:
  - Lista: `GET /people` (`balanceUntilNow`, `currentMonthDue`); total geral = soma dos
    `balanceUntilNow` positivos (valores da API).
  - Extrato: `GET /people/{id}/statement?year&month` — saldo anterior, cobranças (com `key`,
    origem, situação, pago e falta), totais, pagamentos (com `chargeKeys`) e saldo final.
  - Resumo geral: `GET /people/{id}/summary` — origens e totais.
  - O nome da pessoa no detalhe vem do extrato/resumo (`person.name`); 404 → aviso e volta à lista.
- **Rationale**: SC-003 — nenhum cálculo de abatimento na tela.

## 3. Estado no endereço

- **Decision**: rota `/pessoas/:id` + `useMonthUrl` (008) para `mes`, e `aba` (`extrato` padrão |
  `resumo`) com `replace`. Atalho de Receitas: o reembolso navega para
  `/pessoas/{sourceId}?mes={mês do item}` (FR-010; o `sourceId` do reembolso é o id da pessoa).

## 4. Chaves de cache

- **Decision**: `['people']` (já existe), `['person-statement', id, month]`,
  `['person-summary', id]`. Toda mutação de pessoa/cobrança/pagamento invalida `['people']`,
  `['person-statement', id]`, `['person-summary', id]` e `['summary']` (reembolsos em Receitas).
  Mutações de despesas e recorrências (007/008) passam a invalidar também `['people']` e as chaves
  de pessoa, porque mudam cobranças.

## 5. Pagamento

- **Decision**: `PaymentFormDialog` (pessoa, valor, data, observação e, recolhida em "Escolher o que
  este pagamento quita (opcional)", a lista de cobranças em aberto). Valor sugerido = `currentMonthDue`
  quando positivo (clarify Q2). A lista de cobranças vem do extrato do mês atual e do anterior (as
  em aberto com `remaining > 0`); enviar `chargeKeys` só quando houver escolha. Na edição, a escolha
  começa com os `chargeKeys` do pagamento.
- **Rationale**: FR-007/FR-015; a regra de abatimento é toda da API (FR-012 da 004).
- **Alternatives considered**: buscar todas as cobranças em aberto de todos os meses (não há endpoint
  próprio; o resumo traz origens, não cobranças) — cobranças mais antigas em aberto são abatidas
  automaticamente pela API mesmo sem escolha.

## 6. Cobrança avulsa (sem observação)

- **Decision**: formulário com descrição, valor e data (padrão hoje). **Sem observação**: o extrato
  não devolve a observação da cobrança e o `PUT` grava a observação enviada — editar apagaria uma
  observação salva antes. Spec FR-009 ajustado. Editar/remover só em cobranças com origem
  `Manual` (o `originId` é o id da cobrança).
- **Follow-up possível (backend)**: incluir `notes` no item de cobrança do extrato; aí a tela passa a
  oferecer observação.

## 7. Componentes

- **Decision**: `PeopleList` (cartões com "deve até agora", "no mês", crédito, botão "Pagamento" e
  menu Renomear/Remover), `PersonFormDialog`, `DeletePersonDialog`, `StatementView` (MonthPicker,
  blocos saldo anterior → cobranças → total devido → pagamentos → saldo final), `ChargeRow`
  (situação com badge e "falta R$ X"; origem despesa/conta fixa vira link), `OverviewView` (origens e
  totais), `PaymentFormDialog`, `ChargeFormDialog`, `DeleteEntryDialog`.
- Links de origem: despesa → `/despesas?despesa={originId}` e conta fixa →
  `/contas-fixas?recorrencia={originId}` (as telas da 007/008 já abrem o detalhe pelo endereço).

## 8. Valores com sinal

- **Decision**: utilitário `formatBalance(value)` em `lib/format.ts`: positivo → "R$ X", negativo →
  "crédito de R$ X", zero → "R$ 0,00".

## 9. Testes

- **Decision**: `test/people-store.ts` — pessoas, cobranças (avulsas e semeadas como vindas de
  despesa/conta fixa) e pagamentos em memória, com abatimento simplificado (escolhidas primeiro,
  depois das mais antigas, sobra vira crédito) respondendo `/people`, `/statement`, `/summary`,
  `/charges` e `/payments`. Testes conferem que a tela mostra o que a API devolve e envia o corpo
  certo; a regra exata de abatimento é responsabilidade (e tem testes) do backend.

## 10. Dependências

- **Decision**: nenhuma dependência npm nova.
