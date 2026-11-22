# Feature Specification: Tela de Resumo do Mês

**Feature Branch**: `010-frontend-monthly-summary`

**Created**: 2026-11-22

**Status**: Draft

**Input**: User description: "Resumo do mês (/), a tela inicial do app. Previsto do mês: entradas
(salário, avulsas, reembolsos) menos saídas (parcelas, contas fixas), dando o saldo previsto.
Realizado: o que já entrou e saiu, com o saldo realizado. Pendências do mês atual: o que ainda falta
pagar e receber, com atalho para cada item. Saldo acumulado: saldo do fim do mês anterior e saldo
previsto no fim deste mês, a partir do saldo inicial; sem saldo inicial, aviso com atalho para
cadastrá-lo. Itens do mês: entradas e saídas em duas listas, com filtro por categoria e troca de mês,
como nas outras telas."

## Clarifications

### Session 2026-11-22

- Q: Qual número é o destaque principal da tela inicial? → A: O "Saldo no fim do mês" (acumulado);
  sem acumulado (sem saldo inicial, antes dele ou com filtro), o destaque passa a ser o saldo
  previsto do mês.
- Q: Os itens das listas de entradas e saídas (não só as pendências) podem ser marcados como
  pagos/recebidos direto no resumo? → A: Sim; parcelas, contas fixas e receitas têm a caixa de
  pago/recebido nas listas (mesmo comportamento das outras telas); reembolsos continuam só leitura.

## Visão geral

A tela inicial (hoje "em construção") passa a responder a pergunta central da planilha: **quanto
sobra este mês — e quanto vai sobrar no fim dele**. Ela junta o que as outras telas registram
(despesas e parcelas, receitas, contas fixas e reembolsos de pessoas) e mostra, para o mês
escolhido, o previsto, o realizado, o saldo acumulado desde o saldo inicial e, no mês atual, as
pendências de meses anteriores.

```text
Resumo do mês
◀  novembro de 2026  ▶                      Categoria: [Todas ▾]
┌──────────────────────────────────────────────────────────────┐
│ Saldo no fim do mês (previsto)                 R$ 3.380,00    │
│ Veio de outubro R$ 1.000,00 · saldo do mês + R$ 2.380,00      │
├──────────────────────┬───────────────────────────────────────┤
│ Previsto             │ Realizado                             │
│ Entradas R$ 8.500,00 │ Recebido R$ 6.000,00                  │
│ Saídas   R$ 6.120,00 │ Pago     R$ 4.870,00                  │
│ Saldo    R$ 2.380,00 │ Saldo    R$ 1.130,00                  │
├──────────────────────┴───────────────────────────────────────┤
│ Pendências de meses anteriores: a pagar R$ 120,00 · a receber R$ 500,00 │
│   Internet · outubro ............ R$ 120,00   [pagar]         │
│   13º salário · outubro ......... R$ 500,00   [receber]       │
├──────────────────────────────────────────────────────────────┤
│ [ Entradas | Saídas ]                                         │
│   05/11 ✓ Salário ........................ R$ 6.000,00        │
│   20/11   13º salário .................... R$ 2.500,00        │
└──────────────────────────────────────────────────────────────┘
```

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver o previsto e o realizado do mês (Priority: P1)

A família abre o app e vê, para o mês atual, quanto entra e quanto sai (previsto) e quanto já
entrou e saiu de fato (realizado), com os saldos; troca o mês para conferir meses passados ou
planejar os próximos.

**Why this priority**: é a pergunta que a planilha responde todo mês; sem ela, a tela inicial não
tem conteúdo.

**Independent Test**: com receitas, parcelas e contas fixas pela API, abrir o resumo, trocar meses
e conferir os totais.

**Acceptance Scenarios**:

1. **Given** em novembro há salário de R$ 6.000,00, 13º de R$ 2.500,00 e saídas somando
   R$ 6.120,00, **When** a família abre o resumo, **Then** vê no previsto entradas R$ 8.500,00,
   saídas R$ 6.120,00 e saldo R$ 2.380,00 (valores da API).
2. **Given** o salário já recebido e R$ 4.870,00 das saídas pagas, **When** a família vê o resumo,
   **Then** o realizado mostra recebido R$ 6.000,00, pago R$ 4.870,00 e saldo R$ 1.130,00.
3. **Given** um mês em que as saídas passam as entradas, **When** a família o vê, **Then** o saldo
   aparece negativo, com destaque de alerta.
4. **Given** a família avança para um mês futuro, **When** o resumo atualiza, **Then** vê a
   previsão daquele mês (recorrentes e parcelas a vencer) e o mês fica no endereço.
5. **Given** um mês sem lançamentos, **When** a família o abre, **Then** vê tudo zerado e um
   convite para cadastrar despesas e receitas (atalhos para as telas).

---

### User Story 2 - Saldo acumulado (Priority: P1)

A família vê quanto dinheiro terá no fim do mês: o saldo que veio do mês anterior mais o saldo do
mês, a partir do saldo inicial informado em Configurações.

**Why this priority**: "quanto vai sobrar no fim do mês" é o número que orienta as decisões; é o
diferencial do app sobre olhar só o mês isolado.

**Independent Test**: com saldo inicial e lançamentos pela API, conferir o saldo anterior e o
acumulado em meses diferentes.

**Acceptance Scenarios**:

1. **Given** saldo inicial em 01/11/2026 e o saldo anterior de dezembro em R$ 1.000,00, **When** a
   família vê dezembro, **Then** o destaque principal é "Saldo no fim do mês" (acumulado da API),
   com "veio de novembro R$ 1.000,00" e o saldo do mês.
2. **Given** o mês atual, **When** a família vê o acumulado, **Then** a tela indica que é a
   projeção de fechamento (conta o que ainda vai entrar e sair até o fim do mês).
3. **Given** um mês já encerrado, **When** a família o vê, **Then** a tela indica que o acumulado
   usa o realizado daquele mês.
4. **Given** não há saldo inicial, **When** a família abre o resumo, **Then** vê os saldos do mês
   normalmente e, no lugar do acumulado, o aviso "Informe o saldo inicial para ver quanto vai
   sobrar no fim do mês" com atalho para Configurações.
5. **Given** um mês anterior ao do saldo inicial, **When** a família o vê, **Then** não há
   acumulado e a tela explica que o acompanhamento começa no mês do saldo inicial.
6. **Given** um filtro de categoria, **When** a família filtra, **Then** o acumulado não aparece e a
   tela explica que ele vale só para a família inteira (sem filtro).

---

### User Story 3 - Pendências de meses anteriores (Priority: P1)

No mês atual, a família vê o que ficou para trás — contas não pagas e receitas não recebidas de
meses encerrados —, com totais a pagar e a receber, e resolve cada item dali mesmo.

**Why this priority**: é o que a planilha esconde e faz o saldo "real" divergir; resolver as
pendências mantém o acumulado confiável.

**Independent Test**: com itens em aberto em meses anteriores pela API, ver as pendências no mês
atual e marcar um item como pago.

**Acceptance Scenarios**:

1. **Given** a internet de outubro (R$ 120,00) a pagar e o 13º de outubro (R$ 500,00) não
   recebido, **When** a família abre o mês atual, **Then** vê "Pendências de meses anteriores" com
   a pagar R$ 120,00 e a receber R$ 500,00, e a lista dos itens (nome, mês de origem, valor).
2. **Given** uma pendência de conta fixa, parcela ou receita, **When** a família a marca como
   paga/recebida ali, **Then** ela sai das pendências, o realizado do mês de origem muda e um aviso
   confirma; o saldo acumulado do mês atual não muda (a pendência já estava no previsto).
3. **Given** uma pendência de reembolso de pessoa, **When** a família toca nela, **Then** abre a
   pessoa (o recebimento é registrado em Pessoas).
4. **Given** tocar no nome de uma pendência, **When** a navegação acontece, **Then** abre o
   detalhe na tela correspondente (despesa, conta fixa, receita ou pessoa).
5. **Given** não há pendências ou o mês não é o atual, **When** a família vê o resumo, **Then** a
   seção não aparece.

---

### User Story 4 - Itens do mês (Priority: P2)

A família vê as entradas e as saídas do mês em duas listas, filtra por categoria e abre cada item
na tela dele.

**Why this priority**: os totais respondem "quanto"; as listas respondem "o quê", mas o detalhe de
cada tipo já existe nas outras telas.

**Independent Test**: com lançamentos pela API, alternar entre entradas e saídas, filtrar e abrir
itens.

**Acceptance Scenarios**:

1. **Given** o mês com entradas e saídas, **When** a família vê as listas, **Then** cada item mostra
   data, nome, categoria (ou "reembolso"), parcela n/total quando houver, valor e se já foi
   recebido/pago, em ordem de data.
2. **Given** a família escolhe uma categoria, **When** a tela atualiza, **Then** listas e totais
   consideram só aquela categoria (reembolsos não aparecem com filtro) e a categoria fica no
   endereço.
3. **Given** a família toca num item, **When** a navegação acontece, **Then** abre o detalhe na tela
   dele: parcela → Despesas, receita avulsa ou recorrente → Receitas, conta fixa → Contas fixas,
   reembolso → Pessoas.
4. **Given** uma parcela paga antes do vencimento, **When** a família vê o mês do pagamento, **Then**
   ela aparece com a marca "antecipada".
5. **Given** o 13º ainda a receber, **When** a família marca a caixa dele na lista de entradas,
   **Then** ele passa a recebido, o realizado muda e um aviso confirma; desmarcar desfaz.

---

### Edge Cases

- Mês fora de 2000-01..2100-12 ou inválido no endereço: abre o mês atual; categoria desconhecida →
  todas.
- Saldo inicial no meio do mês: no mês do saldo inicial, só contam itens a partir da data de
  referência (regra da API); a tela mostra o que a API devolver.
- Valores muito grandes ou negativos: cabem nos cartões sem cortar no celular.
- Pendência marcada como paga em outro aparelho: a ação seguinte mostra a mensagem da API e a lista
  é atualizada.
- Sem conexão e sessão expirada seguem as regras das features 005 a 009.
- Depois de qualquer mudança nas outras telas, o resumo reflete os dados atuais ao voltar a ele.

## Requirements *(mandatory)*

### Functional Requirements

**Mês e totais**

- **FR-001**: A tela inicial (`/`) MUST mostrar, para o mês escolhido (padrão: atual;
  anterior/próximo e escolha direta, 2000-01 a 2100-12), o **previsto** (entradas, saídas, saldo) e
  o **realizado** (recebido, pago, saldo), todos com os valores da API; saldos negativos MUST ter
  destaque de alerta.
- **FR-002**: Mês e categoria MUST ficar no endereço; o filtro de categoria MUST aplicar-se a
  totais e listas.

**Saldo acumulado**

- **FR-003**: Quando a API devolver acumulado, o destaque principal da tela MUST ser "Saldo no fim
  do mês", com o saldo anterior (veio do mês anterior) e o saldo do mês, indicando se é projeção
  (mês atual e futuros) ou realizado (meses encerrados); sem acumulado, o destaque principal MUST
  ser o saldo previsto do mês.
- **FR-004**: Sem saldo inicial, a tela MUST mostrar aviso com atalho para Configurações; antes do
  mês do saldo inicial e com filtro de categoria, MUST explicar por que não há acumulado.

**Pendências**

- **FR-005**: No mês atual, quando houver, a tela MUST mostrar "Pendências de meses anteriores" com
  totais a pagar e a receber e a lista dos itens (nome, mês de origem, valor), da API.
- **FR-006**: Cada pendência de parcela, conta fixa ou receita MUST poder ser marcada como
  paga/recebida ali (data de hoje), com aviso; pendências de reembolso MUST levar à pessoa.

**Itens do mês**

- **FR-007**: A tela MUST mostrar as entradas e as saídas do mês em duas abas, com data, nome,
  categoria (ou "reembolso"), parcela n/total, valor, situação e marca "antecipada", em ordem de
  data; parcelas, contas fixas e receitas MUST ter a caixa de pago/recebido (mesmo comportamento
  das telas de Despesas, Receitas e Contas fixas), e reembolsos MUST ser só leitura.
- **FR-008**: Tocar num item (ou numa pendência) MUST abrir o detalhe na tela correspondente:
  parcela → `/despesas?despesa=…`, receita avulsa → `/receitas?receita=…`, receita recorrente →
  `/receitas?recorrencia=…`, conta fixa → `/contas-fixas?recorrencia=…`, reembolso →
  `/pessoas/{id}?mes=…`.

**Gerais**

- **FR-009**: Mês sem lançamentos MUST mostrar estado zerado com atalhos para Despesas e Receitas.
- **FR-010**: Carregamento com indicador; falha com mensagem e "Tentar novamente"; recusas da API
  aparecem como vieram.
- **FR-011**: Depois de qualquer mudança (inclusive nas outras telas), o resumo MUST refletir o novo
  estado; os totais MUST ser sempre os da API.
- **FR-012**: Textos em português, valores em reais, datas dd/mm/aaaa, meses por extenso; a tela
  MUST funcionar de 360 px a 1920 px sem rolagem horizontal.

### Key Entities

- **Resumo do mês**: mês, entradas e saídas (itens), previsto (entradas, saídas, saldo), realizado
  (recebido, pago, saldo), pendências (a receber, a pagar, itens; só mês atual), acumulado (saldo
  anterior, saldo final; quando há saldo inicial e sem filtro), indicação de saldo inicial ausente.
- **Item do resumo**: origem (parcela, receita avulsa, recorrência, reembolso), id de origem,
  direção (entrada/saída), parcela n/total, nome, categoria, mês, data, valor, quitado, valor e data
  da quitação, antecipada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ao abrir o app, a família vê o saldo previsto do fim do mês sem nenhum toque (é o
  primeiro destaque da tela inicial).
- **SC-002**: Resolver uma pendência de mês anterior leva no máximo 1 toque a partir do resumo.
- **SC-003**: Todos os totais, saldos e pendências exibidos são iguais aos da API para o mesmo mês e
  filtro.
- **SC-004**: Qualquer item do mês abre seu detalhe em no máximo 1 toque.
- **SC-005**: A tela funciona sem rolagem horizontal de 360 px a 1920 px.

## Assumptions

- Todo o cálculo já existe na API (features 003 e 004): `GET /summaries` devolve itens, previsto,
  realizado, pendências (só no mês atual, com saldo inicial e sem filtro), acumulado e a indicação
  de saldo inicial ausente. Esta feature não muda o backend.
- Marcar uma pendência como paga/recebida usa as mesmas operações das telas de Despesas, Receitas e
  Contas fixas.
- A tela continua sendo a rota `/`, já ligada ao item "Resumo do mês" do menu.
- Fora de escopo: gráficos e comparação entre meses, metas de economia, exportar o mês, a observação
  das cobranças avulsas em Pessoas (depende de outra branch do backend).
