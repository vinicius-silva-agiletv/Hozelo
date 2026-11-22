# Feature Specification: Telas de Receitas e Contas Fixas

**Feature Branch**: `008-frontend-incomes-fixed-bills`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Telas de Receitas (/receitas) e Contas fixas (/contas-fixas) do frontend.
Receitas: visão do mês com seletor (mesmo padrão de Despesas), mostrando as receitas avulsas (13º,
venda) e as ocorrências das receitas recorrentes (salário), com total, recebido e a receber; marcar
como recebida ou desfazer; cadastrar, editar e remover receita avulsa; cadastrar receita recorrente.
Contas fixas: lista das contas recorrentes de despesa com o valor atual, o dia de vencimento e a
situação no mês; na ocorrência do mês, ajustar o valor, pular o mês, quitar; na conta, mudar o valor
daqui para frente, encerrar ou reabrir; dividir com uma pessoa. Os ajustes de recorrência (valor do
mês, pular, mudar valor daqui para frente, encerrar/reabrir, quitar) valem para as duas telas."

## Clarifications

### Session 2026-11-21

- Q: Os reembolsos das pessoas aparecem na lista de Receitas? → A: Sim, só para leitura, com a marca
  "reembolso" e o nome da pessoa; entram nos totais (batendo com o resumo do mês) e tocar leva à área
  Pessoas.
- Q: Ao marcar uma conta fixa como paga, dá para informar um valor diferente do previsto? → A: Sim;
  a caixa paga com o valor do mês, e no menu "Pagar com outro valor" (valor + data) ajusta o valor
  daquele mês e quita de uma vez. Nas receitas recorrentes, o equivalente é "Receber com outro
  valor".

## Visão geral

Duas áreas hoje "em construção" passam a ser telas reais, ambas organizadas pelo mês escolhido
(anterior, atual ou próximos), como a tela de Despesas:

- **Receitas**: tudo o que entra no mês — receitas **avulsas** (13º salário, uma venda, um presente)
  e as ocorrências do mês das receitas **recorrentes** (salário) —, com o que já foi recebido e o
  que falta receber.
- **Contas fixas**: as despesas que se repetem todo mês (internet, luz, água, escola), com o valor do
  mês, o vencimento e se já foi paga.

As duas compartilham o jeito de lidar com algo recorrente: um mês pode ter valor diferente (a luz
veio mais cara), pode ser pulado (não houve cobrança), o valor pode mudar daqui para frente (reajuste
da internet), a recorrência pode ser encerrada (cancelou a escola) e reaberta.

```text
Receitas                                        [+ Nova receita]
◀  novembro de 2026  ▶                  Categoria: [Todas ▾]
┌────────────────────────────────────────────────────────┐
│ Previsto R$ 9.500,00 · Recebido R$ 6.000,00 · A receber R$ 3.500,00 │
├────────────────────────────────────────────────────────┤
│ ☑ 05/11  Salário · recorrente ............. R$ 6.000,00 │
│ ☐ 20/11  13º salário (1ª parcela) ......... R$ 3.000,00 │
│ ☐ 25/11  Venda da bicicleta ................. R$ 500,00 │
└────────────────────────────────────────────────────────┘

Contas fixas                                 [+ Nova conta fixa]
◀  novembro de 2026  ▶
┌────────────────────────────────────────────────────────┐
│ ☑ dia 10  Internet · R$ 120,00                       ⋯ │
│ ☐ dia 15  Luz · R$ 310,00 (ajustado; normal R$ 250,00) ⋯ │
│ —  dia 20  Academia · pulada neste mês               ⋯ │
└────────────────────────────────────────────────────────┘
```

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver as receitas do mês (Priority: P1)

A família abre Receitas e vê o que entra no mês atual — avulsas e ocorrências das recorrentes —, com
o previsto, o recebido e o que falta receber. Troca o mês e filtra por categoria.

**Why this priority**: saber quanto entra no mês é metade da conta que a planilha faz; sem essa
visão, cadastrar e receber não têm onde aparecer.

**Independent Test**: com receitas avulsas e recorrentes registradas pela API, abrir a tela, navegar
entre meses e filtrar, conferindo itens e totais.

**Acceptance Scenarios**:

1. **Given** um salário recorrente de R$ 6.000,00 no dia 5 e uma receita avulsa de R$ 3.000,00
   prevista para 20/11/2026, **When** a família abre Receitas em novembro, **Then** vê os dois itens
   em ordem de data, cada um com data, nome, categoria, valor, se já foi recebido e a marca
   "recorrente" no salário, e os totais do mês: previsto, recebido e a receber.
2. **Given** a tela no mês atual, **When** a família avança para dezembro, **Then** vê a ocorrência de
   dezembro do salário (e não a avulsa de novembro), com os totais de dezembro.
3. **Given** a família escolhe uma categoria, **When** a lista atualiza, **Then** mostra só os itens
   daquela categoria, com totais recalculados.
4. **Given** um mês em que o salário foi pulado, **When** a família vê aquele mês, **Then** o salário
   não aparece como previsto.
5. **Given** um mês sem receitas, **When** a família o abre, **Then** vê um estado vazio com a ação
   "Nova receita".
6. **Given** a família recarrega a página, **When** a tela reabre, **Then** mês e filtro continuam os
   mesmos (ficam no endereço).

---

### User Story 2 - Marcar receita como recebida ou desfazer (Priority: P1)

Quando o dinheiro cai, a família marca a receita do mês como recebida; se marcou por engano, desfaz.

**Why this priority**: é o que separa o previsto do realizado no mês.

**Independent Test**: marcar e desmarcar uma avulsa e uma ocorrência recorrente e conferir os totais.

**Acceptance Scenarios**:

1. **Given** a receita avulsa de 20/11 em aberto, **When** a família a marca como recebida, **Then**
   ela aparece recebida (data de hoje), o recebido aumenta e o a receber diminui, e um aviso confirma
   "Receita marcada como recebida.".
2. **Given** a ocorrência de novembro do salário em aberto, **When** a família a marca como recebida,
   **Then** só a ocorrência de novembro fica recebida (dezembro continua em aberto).
3. **Given** uma receita recebida, **When** a família desfaz, **Then** ela volta a ficar em aberto e os
   totais voltam ao que eram.
4. **Given** a família recebeu em outro dia, **When** escolhe "Receber em outra data", **Then** informa
   a data (não futura) e a receita fica recebida naquela data.
5. **Given** a API recusa a operação, **When** a resposta chega, **Then** a marcação volta ao estado
   anterior e a mensagem da API aparece como veio.

---

### User Story 3 - Cadastrar receitas avulsas e recorrentes (Priority: P1)

A família registra uma entrada única (13º, venda) ou uma que se repete todo mês (salário).

**Why this priority**: sem cadastro, a tela fica vazia; o salário recorrente é a base do planejamento.

**Independent Test**: cadastrar uma avulsa e uma recorrente e conferir nos meses corretos.

**Acceptance Scenarios**:

1. **Given** o formulário "Nova receita" no modo "Avulsa", **When** a família informa nome "13º
   salário (1ª parcela)", categoria "13º salário", R$ 3.000,00 e data prevista 20/11/2026, **Then** a
   receita aparece em novembro e um aviso confirma "Receita cadastrada.".
2. **Given** uma avulsa que já entrou, **When** a família marca "Já recebida" e informa a data, **Then**
   ela é cadastrada já como recebida.
3. **Given** o modo "Todo mês", **When** a família informa nome "Salário", categoria "Salário",
   R$ 6.000,00, dia 5 e início em novembro de 2026 (sem fim), **Then** a ocorrência aparece em
   novembro e em todos os meses seguintes, e um aviso confirma "Receita recorrente cadastrada.".
4. **Given** uma recorrente com fim em março de 2027, **When** a família vê abril de 2027, **Then** ela
   não aparece.
5. **Given** campos inválidos (sem nome, sem categoria, valor zero, dia fora de 1 a 31, fim antes do
   início, data de recebimento futura), **When** a família tenta salvar, **Then** cada campo mostra sua
   mensagem; recusas da API aparecem no formulário como vieram.
6. **Given** não há categorias de receita, **When** a família abre o formulário, **Then** vê o aviso
   com atalho para Configurações.

---

### User Story 4 - Ver, cadastrar e pagar contas fixas (Priority: P1)

A família abre Contas fixas, vê as contas do mês com valor, dia de vencimento e situação, cadastra
uma nova e marca como paga quando paga.

**Why this priority**: as contas fixas são a maior parte das saídas previsíveis do mês; hoje só
existem pela API.

**Independent Test**: com contas fixas registradas pela API, navegar entre meses, cadastrar uma conta
e marcar/desmarcar o pagamento de um mês.

**Acceptance Scenarios**:

1. **Given** Internet (R$ 120,00, dia 10) e Luz (R$ 250,00, dia 15) ativas, **When** a família abre
   Contas fixas em novembro, **Then** vê as duas em ordem de dia, cada uma com nome, categoria, valor
   do mês, dia de vencimento e situação (em aberto, paga, pulada), e os totais do mês: previsto, pago
   e a pagar.
2. **Given** a família marca a Internet de novembro como paga, **When** a resposta chega, **Then** só
   novembro fica pago, os totais mudam e um aviso confirma "Conta marcada como paga."; desfazer volta
   ao estado anterior; "Pagar em outra data" aceita data não futura.
3. **Given** a Luz prevista em R$ 250,00, **When** a família escolhe "Pagar com outro valor" em
   novembro e informa R$ 310,00 e a data, **Then** novembro fica ajustado para R$ 310,00 e pago naquela
   data, dezembro continua R$ 250,00, e um aviso confirma "Conta marcada como paga.".
4. **Given** o formulário "Nova conta fixa", **When** a família informa nome "Escola", categoria
   "Educação", R$ 900,00, dia 8 e início em fevereiro de 2027, **Then** a conta aparece de fevereiro em
   diante (não em novembro) e um aviso confirma "Conta fixa cadastrada.".
5. **Given** uma conta encerrada em outubro, **When** a família vê novembro, **Then** ela não aparece
   no mês; ela continua visível numa seção "Encerradas", de onde pode ser reaberta.
6. **Given** um mês sem contas fixas, **When** a família o abre, **Then** vê um estado vazio com a ação
   "Nova conta fixa".

---

### User Story 5 - Ajustar um mês ou a recorrência (Priority: P2)

Numa receita recorrente ou numa conta fixa, a família ajusta só um mês (outro valor ou pular) ou muda
a recorrência inteira (valor daqui para frente, encerrar, reabrir, editar dados).

**Why this priority**: a luz muda todo mês e reajustes acontecem; sem isso, o previsto fica errado.
Vem depois de ver e cadastrar.

**Independent Test**: ajustar o valor de um mês, pular outro, mudar o valor a partir de um mês,
encerrar e reabrir, conferindo os meses afetados.

**Acceptance Scenarios**:

1. **Given** a Luz com R$ 250,00, **When** a família escolhe "Ajustar este mês" em novembro e informa
   R$ 310,00, **Then** só novembro passa a R$ 310,00, a lista indica "ajustado (normal R$ 250,00)" e
   dezembro continua R$ 250,00.
2. **Given** a Academia, **When** a família escolhe "Pular este mês" em novembro, **Then** novembro
   aparece como "pulada" e fora dos totais; "Desfazer ajuste" volta ao valor normal.
3. **Given** a Internet com R$ 120,00, **When** a família escolhe "Mudar valor" com R$ 135,00 a partir
   de janeiro de 2027, **Then** de janeiro em diante o valor é R$ 135,00 e novembro e dezembro
   continuam R$ 120,00; o detalhe mostra o histórico de valores.
4. **Given** a Escola, **When** a família escolhe "Encerrar" com último mês em junho de 2027, **Then**
   ela não aparece de julho em diante; "Reabrir" remove o fim.
5. **Given** a família edita nome, categoria, dia de vencimento ou observação, **When** salva, **Then**
   a mudança vale para todos os meses e um aviso confirma "Recorrência atualizada.".
6. **Given** a família remove uma recorrência e confirma, **When** a resposta chega, **Then** ela some
   de todos os meses e um aviso confirma "Recorrência removida."; recusas da API aparecem no diálogo.
7. **Given** os mesmos ajustes numa receita recorrente (salário), **When** a família os faz na tela
   de Receitas, **Then** o comportamento é o mesmo.

---

### User Story 6 - Editar e remover receitas avulsas (Priority: P2)

A família corrige ou apaga uma receita avulsa.

**Why this priority**: correções são necessárias, mas menos frequentes.

**Independent Test**: editar valor e data de uma avulsa e removê-la.

**Acceptance Scenarios**:

1. **Given** uma avulsa, **When** a família a abre e edita valor e data prevista, **Then** a lista do
   mês reflete a mudança (inclusive mudando de mês se a data mudar) e um aviso confirma "Receita
   atualizada.".
2. **Given** uma avulsa, **When** a família escolhe remover e confirma, **Then** ela some e um aviso
   confirma "Receita removida.".

---

### User Story 7 - Dividir uma conta fixa com uma pessoa (Priority: P3)

Ao cadastrar ou editar uma conta fixa, a família indica que ela (ou parte dela) é de outra pessoa,
como já faz nas despesas.

**Why this priority**: completa o fluxo de reembolsos; usa o mesmo componente da tela de Despesas.

**Independent Test**: com uma pessoa cadastrada pela API, marcar uma conta fixa como dela com 50% e
conferir a indicação na lista e no detalhe.

**Acceptance Scenarios**:

1. **Given** existe a pessoa "Esposa", **When** a família marca a Internet como dela com 50%, **Then**
   a lista e o detalhe mostram "Esposa · 50%" e o formulário mostra a parte dela por mês.
2. **Given** não há pessoas cadastradas, **When** a família abre o formulário, **Then** a opção explica
   que as pessoas são cadastradas na área Pessoas.
3. **Given** uma receita recorrente, **When** a família abre o formulário dela, **Then** a opção de
   dividir com uma pessoa não aparece (só despesas podem ser divididas).

---

### Edge Cases

- Recorrência que começa num mês futuro: não aparece nos meses anteriores ao início.
- Dia de vencimento 31 em mês com menos dias: a data exibida é a que a API devolver (último dia do
  mês).
- Ajuste de mês com o mesmo valor normal: tratado pela API; a tela mostra o que ela devolver.
- Receber/pagar uma ocorrência pulada: a ação não é oferecida (é preciso desfazer o pulo antes).
- Encerrar com último mês antes do início, ou mudar valor antes do início: o formulário mostra a
  mensagem; recusas da API aparecem como vieram.
- Marcação em dois toques rápidos: a segunda espera a primeira terminar (sem enviar duas vezes).
- Reembolsos de pessoas (feature 004): aparecem na lista de Receitas só para leitura (sem caixa de
  recebido, editar ou remover), com a marca "reembolso" e o nome da pessoa, e entram nos totais;
  tocar neles leva à área Pessoas.
- Sem conexão, sessão expirada e mês inválido no endereço seguem as regras das features 005 a 007.

## Requirements *(mandatory)*

### Functional Requirements

**Receitas**

- **FR-001**: A tela de Receitas MUST mostrar, para o mês escolhido (padrão: atual), as receitas
  avulsas previstas no mês e as ocorrências das receitas recorrentes, em ordem de data, com nome,
  categoria, valor, situação (a receber / recebida) e a marca "recorrente" quando for o caso, além
  dos reembolsos de pessoas do mês (só leitura, marca "reembolso" e nome da pessoa, tocar leva a
  Pessoas), e os totais do mês: previsto, recebido e a receber, iguais aos do resumo do mês.
- **FR-002**: A tela MUST permitir trocar o mês (anterior/próximo e escolha direta, de 2000-01 a
  2100-12) e filtrar por categoria de receita; mês e filtro MUST ficar no endereço.
- **FR-003**: A família MUST poder marcar e desmarcar como recebida uma avulsa ou a ocorrência do mês
  de uma recorrente, com data de hoje por padrão ou outra data não futura; para recorrentes, "Receber
  com outro valor" ajusta o valor daquele mês e quita de uma vez.
- **FR-004**: O cadastro de receita MUST oferecer dois modos: **Avulsa** (nome até 100, categoria de
  receita, valor > 0, data prevista, observação até 500, e opcionalmente "Já recebida" com data não
  futura) e **Todo mês** (nome, categoria de receita, valor > 0, dia do mês 1–31, mês de início,
  mês de fim opcional não anterior ao início, observação).
- **FR-017**: Nos cadastros, os padrões seguem a tela de Despesas: data prevista (avulsa) = dia de
  hoje no mês aberto; recorrente começa no mês aberto, com o dia de hoje como dia do mês (até 31) e
  sem fim.
- **FR-005**: A família MUST poder editar e remover receitas avulsas (remoção com confirmação).

**Contas fixas**

- **FR-006**: A tela de Contas fixas MUST mostrar, para o mês escolhido, as contas recorrentes de
  despesa ativas naquele mês, ordenadas pelo dia de vencimento, com nome, categoria, valor do mês,
  dia, situação (em aberto, paga, pulada) e indicação de valor ajustado, e os totais do mês: previsto,
  pago e a pagar; contas encerradas MUST ficar numa seção "Encerradas".
- **FR-007**: A família MUST poder marcar e desmarcar como paga a ocorrência do mês de uma conta fixa,
  com data de hoje por padrão ou outra data não futura, e "Pagar com outro valor" (valor > 0 e data
  não futura), que ajusta o valor daquele mês e quita de uma vez.
- **FR-008**: O cadastro de conta fixa MUST ter nome, categoria de despesa, valor > 0, dia do mês
  1–31, mês de início, mês de fim opcional, observação e divisão opcional com uma pessoa (integral ou
  percentual 1–100), como nas despesas.

**Recorrências (receitas recorrentes e contas fixas)**

- **FR-009**: Para a ocorrência de um mês, a família MUST poder ajustar o valor só daquele mês, pular
  o mês e desfazer o ajuste; ocorrências puladas MUST ficar fora dos totais e não oferecer
  receber/pagar.
- **FR-010**: Para a recorrência, a família MUST poder mudar o valor a partir de um mês (mantendo os
  meses anteriores), encerrar informando o último mês, reabrir, editar nome/categoria/dia/observação
  (e pessoa, nas contas fixas) e remover com confirmação.
- **FR-011**: O detalhe de uma recorrência MUST mostrar os dados, o valor atual, o histórico de
  valores (a partir de qual mês) e os meses com ajuste, pulo ou quitação.

**Gerais**

- **FR-012**: Formulários MUST usar o painel responsivo (diálogo no computador, de baixo no
  celular); operações concluídas MUST mostrar aviso breve; mensagens da API MUST aparecer como
  vieram.
- **FR-013**: Listas MUST mostrar carregamento, estado vazio com ação e, em falha, mensagem com
  "Tentar novamente".
- **FR-014**: Depois de qualquer mudança, a lista do mês, os totais, o detalhe e as contagens de
  categorias MUST refletir o novo estado; os totais exibidos MUST ser os da API.
- **FR-015**: Sem categorias do tipo necessário, o formulário MUST avisar com atalho para
  Configurações.
- **FR-016**: Textos em português, valores em reais, datas dd/mm/aaaa, meses por extenso; as telas
  MUST funcionar de 360 px a 1920 px sem rolagem horizontal.

### Key Entities

- **Receita avulsa**: nome, categoria, valor, data prevista, recebida (data), observação.
- **Recorrência**: tipo (receita ou despesa), nome, categoria, dia do mês, mês de início, mês de fim,
  ativa, valor atual, histórico de valores, observação, pessoa e percentual (só despesas).
- **Ocorrência do mês**: recorrência + mês, valor do mês (normal ou ajustado), pulada, quitada (data).
- **Item de receita do mês**: avulsa, ocorrência de recorrente ou reembolso, com data, valor,
  situação e origem.
- **Totais do mês**: previsto, realizado (recebido/pago) e pendente (a receber/a pagar).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cadastrar o salário recorrente leva menos de 30 segundos a partir da tela de Receitas.
- **SC-002**: Marcar uma receita como recebida ou uma conta fixa como paga leva um toque, e os totais
  se atualizam em menos de 1 segundo após a resposta.
- **SC-003**: Ajustar o valor da luz de um mês leva no máximo 3 toques mais a digitação do valor.
- **SC-004**: Os totais exibidos são sempre iguais aos da API para o mesmo mês e filtro.
- **SC-005**: 100% das recusas da API aparecem junto da ação que as causou.
- **SC-006**: As duas telas funcionam sem rolagem horizontal de 360 px a 1920 px.

## Assumptions

- Todo o comportamento já existe na API (features 003 e 004): receitas avulsas, recebimento,
  recorrências, ajustes por mês, mudança de valor, encerramento, quitação, resumo mensal e marcação de
  pessoa em recorrências de despesa. Esta feature não muda o backend.
- A visão do mês de Receitas usa o resumo mensal da API (que já reúne avulsas, ocorrências e
  reembolsos com os totais previsto e realizado); a de Contas fixas combina a lista de recorrências de
  despesa com as ocorrências do mês.
- Contas fixas não aparecem na tela de Despesas (que mostra parcelas); as duas se juntam no Resumo do
  mês (feature futura).
- Reaproveita os componentes das features 005 a 007: `MonthPicker`, `MoneyInput`, `NativeSelect`,
  painel responsivo, caixa de pago com trava, seletor de pessoa, estado no endereço.
- Fora de escopo: Resumo do mês (saldo acumulado, pendências), cobranças e pagamentos de pessoas,
  lembretes de vencimento, importação da planilha.
