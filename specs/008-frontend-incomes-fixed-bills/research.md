# Research: Telas de Receitas e Contas Fixas

**Feature**: `008-frontend-incomes-fixed-bills` | **Date**: 2026-11-21

Decisões técnicas (Decision / Rationale / Alternatives). Base: 005–007 (sessão, cliente HTTP,
`MonthPicker` com escolha direta, `MoneyInput`, `NativeSelect`, `ResponsiveDialog`, `ConfirmDialog`,
caixa de pago com trava, seletor de pessoa, estado no endereço, `expensesStore` nos testes).

## 1. Organização por feature

- **Decision**:
  - `features/recurrences`: api, hooks, schemas, prévias e os componentes compartilhados pelas duas
    telas — formulário de recorrência, detalhe com histórico, ajustar/pular mês, mudar valor,
    encerrar/reabrir, quitar com outro valor, remover.
  - `features/incomes`: api, hooks, schemas e a página `/receitas` (lista do mês, receita avulsa).
  - `features/fixed-bills`: página `/contas-fixas` (lista do mês, seção Encerradas).
  - `features/summary`: só `api.ts` + `useMonthlySummary` (o resumo mensal é a fonte do mês nas duas
    telas e será a base da tela de Resumo).
  - Reaproveita de `features/expenses`: `OptionGroup`, seletor de pessoa e caixa de pago, movidos
    para `components/shared` (deixam de ser de uma feature só).
- **Alternatives considered**: uma feature só "recorrências" com as duas páginas (misturaria a
  receita avulsa, que não é recorrente).

## 2. Fonte dos dados do mês

- **Decision**:
  - **Receitas**: `GET /summaries?year&month[&categoryId]` → `incomes` (avulsas, ocorrências de
    recorrentes e reembolsos) com `forecast.incomes` (previsto) e `realized.received` (recebido) da
    API; "a receber" = soma dos itens não quitados (valores da API).
  - **Contas fixas**: `GET /recurrences?kind=Expense` (todas, inclusive encerradas) + o mesmo resumo
    do mês (`expenses` com `source = Recurrence`: data, valor do mês, quitada, valor pago) + o
    detalhe de cada recorrência ativa no mês (`GET /recurrences/{id}`: meses ajustados/pulados e
    histórico de valores), carregados em paralelo e em cache.
  - Uma ocorrência **pulada** não vem no resumo (a API a exclui); a tela a identifica pelo detalhe
    (`months[].skipped`). O valor **normal** do mês vem do histórico de valores; "ajustado" quando o
    mês tem valor próprio.
  - Totais de Contas fixas: previsto = soma dos valores do mês das contas não puladas; pago = soma do
    efetivamente pago; a pagar = soma das não quitadas — todos a partir dos valores da API (o resumo
    não traz um total só de recorrências).
- **Rationale**: SC-004 (totais da API) e a regra de reembolsos da clarify Q1 vêm prontos no resumo;
  sem endpoint novo (constitution V). Uma família tem poucas contas fixas (dezenas), então um
  detalhe por conta é barato e fica em cache.
- **Alternatives considered**: endpoint novo "contas fixas do mês" no backend (fora do escopo, só
  frontend); mostrar "pulada"/"ajustado" só no detalhe (contraria US4-1 e US5-1).

## 3. Estado no endereço

- **Decision**: o hook de endereço da 007 é generalizado em `lib/use-month-url.ts` (mês, categoria e
  item aberto, com `replace`/`push` iguais). Parâmetros: Receitas `mes`, `categoria`, `receita`
  (avulsa aberta) e `recorrencia`; Contas fixas `mes`, `recorrencia`. `use-expenses-url.ts` passa a
  usá-lo.

## 4. Chaves de cache e atualização

- **Decision**: novas chaves: `['summary', month, categoryId]`, `['incomes']`, `['income', id]`,
  `['recurrences', kind]`, `['recurrence', id]`. Toda mutação de receita/recorrência invalida
  `['summary']`, `['recurrences']` e o item; cadastrar/editar/remover invalidam `['categories']`
  (contagens). Marcar recebida/paga atualiza a caixa na hora (otimista, como na 007) e os totais
  vêm do refetch.

## 5. Receber/pagar e "com outro valor"

- **Decision**:
  - Avulsa: `POST/DELETE /incomes/{id}/receipt` (`receivedOn`).
  - Ocorrência: `POST/DELETE /recurrences/{id}/months/{y}/{m}/settlement` (`settledOn`).
  - "Pagar/Receber com outro valor" (clarify Q2): `PUT /recurrences/{id}/months/{y}/{m}`
    (`amount`) seguido de `POST …/settlement`; se a segunda falhar, o ajuste fica e a mensagem
    aparece (o mês continua em aberto com o novo valor, que é o estado correto para tentar de novo).
  - A caixa de pago da 007 vira genérica (`PaymentToggle` recebe `onToggle`), mantendo a trava que
    só destrava depois do render com a resposta.
- **Rationale**: SC-002/SC-003; mesmo comportamento da tela de Despesas.

## 6. Ajustes da recorrência

- **Decision**: menu da linha/detalhe com: Ajustar este mês (`PUT months/{y}/{m}` com `amount`),
  Pular este mês (`skipped: true`), Desfazer ajuste (`DELETE months/{y}/{m}`), Mudar valor
  (`PUT /{id}/amount` com `amount` + `fromMonth`, padrão o mês aberto), Encerrar (`PUT /{id}/end`
  com `endMonth`, padrão o mês aberto), Reabrir (`DELETE /{id}/end`), Editar (`PUT /{id}`),
  Remover (`DELETE /{id}`). Mês escolhido com o `MonthPicker` dentro do painel.

## 7. Formulários

- **Decision**: React Hook Form + Zod no `ResponsiveDialog`.
  - "Nova receita" com `OptionGroup` Avulsa | Todo mês; avulsa: data prevista (`<input type="date">`,
    padrão hoje no mês aberto) e "Já recebida" (interruptor + data); recorrente: dia do mês (1–31,
    padrão o dia de hoje), início (`MonthPicker`, padrão o mês aberto) e fim opcional.
  - "Nova conta fixa" = formulário de recorrência com `kind = Expense` e seletor de pessoa.
  - Editar recorrência não muda valor nem início (a API não aceita no `PUT`): valor muda por "Mudar
    valor"; o formulário de edição mostra só nome, categoria, dia, observação e pessoa.

## 8. Reembolsos na lista de Receitas

- **Decision**: itens com `source = Reimbursement` aparecem sem caixa de recebido e sem menu, com a
  marca "reembolso" e o nome; tocar navega para `/pessoas` (hoje "em construção").

## 9. Testes

- **Decision**: `test/finance-store.ts` — receitas avulsas e recorrências em memória (com meses,
  histórico de valores, encerramento e pessoa) respondendo `/incomes`, `/recurrences` e
  `/summaries` com as regras essenciais da feature 003 (ocorrência por mês, pulo, ajuste, valor
  vigente pelo histórico, quitação, reembolsos simulados como itens prontos). Mesma estratégia da 007.

## 10. Dependências

- **Decision**: nenhuma dependência npm nova.
