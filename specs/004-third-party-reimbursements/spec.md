# Feature Specification: Reembolsos de Terceiros

**Feature Branch**: `004-third-party-reimbursements`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Uma forma de cadastrar tudo o que a família tem a receber de outras
pessoas: o total que a esposa tem que mandar, listando o que ela gastou; o sogro que usou o cartão
de crédito para comprar peças do carro, com o que ele passou, a quantidade de parcelas e o total que
ele tem que mandar, com um resumo. Se a pessoa não conseguir pagar tudo o que devia no mês, no mês
seguinte o valor devido soma com a dívida do mês novo (como é feito hoje na planilha)."

## Clarifications

### Session 2026-11-21

- Q: Como os reembolsos entram no resumo do mês e no saldo acumulado da família? → A: Como
  entradas: previsto = cobranças do mês; realizado = pagamentos recebidos no mês; o saldo das
  pessoas não pago até o mês anterior entra como pendência a receber no mês atual.
- Q: Contas fixas recorrentes (feature 003) também podem ser marcadas como de uma pessoa? → A: Sim,
  integral ou percentual; cada mês da conta fixa gera uma cobrança com o valor daquele mês
  (incluindo ajustes; mês pulado não gera cobrança).
- Q: O pagamento abate automaticamente as cobranças mais antigas ou a família escolhe o que ele
  quita? → A: A família pode escolher as cobranças que o pagamento quita; o que sobrar do pagamento
  abate as cobranças mais antigas em aberto (e, se ainda sobrar, vira crédito).
- Q: Uma categoria pode ter uma pessoa padrão para marcar despesas automaticamente? → A: Não; cada
  despesa (ou conta fixa) é marcada individualmente.
- Q: Além do extrato mensal, há um resumo geral por pessoa agrupado por compra? → A: Sim: cada
  origem com descrição, parcelas, cobranças vencidas e futuras, total, pago e quanto falta, mais o
  total devido até hoje e incluindo o futuro.

## Visão geral do modelo

Cada **pessoa** (esposa, sogro) tem uma **conta corrente com a família**:

```text
Sogro — dezembro/2026
  Saldo anterior (não pago até novembro) ....  R$ 300,00
  Cobranças de dezembro
    Peças do carro (parcela 4/10) ...........  R$ 150,00
    Pneu (parcela 1/3) ......................  R$ 200,00
  ───────────────────────────────────────────
  Total devido em dezembro ..................  R$ 650,00
  Pagamentos recebidos em dezembro .........  −R$ 500,00
  Saldo que passa para janeiro .............  R$ 150,00
```

- **De onde vêm as cobranças**:
  - **despesas da família marcadas como da pessoa**: a compra está no cartão de vocês (feature 002),
    então continua sendo despesa da família; marcar a despesa como do sogro faz cada parcela virar
    também uma cobrança para ele, no mês da parcela;
  - **contas fixas marcadas como da pessoa** (feature 003, ex.: a linha de celular do sogro no
    plano da família): cada mês da conta fixa gera uma cobrança para a pessoa;
  - **cobranças avulsas**: valores que a pessoa deve sem ser uma despesa lançada (ex.: "emprestei
    R$ 300 em dinheiro").
- **Pagamentos**: a pessoa manda qualquer valor, quando puder, inclusive parcial. Ao registrar, a
  família pode escolher quais cobranças aquele pagamento quita (ex.: "é a parcela das peças"); o
  que sobrar, ou todo o pagamento quando nada é escolhido, abate as cobranças mais antigas.
- **Saldo que passa adiante**: o que não foi pago num mês soma automaticamente com as cobranças do
  mês seguinte. Se a pessoa mandar a mais, fica um crédito que abate as próximas cobranças.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar as pessoas (Priority: P1)

A família cadastra as pessoas que costumam dever dinheiro (ex.: "Esposa", "Sogro"), podendo
renomear e remover.

**Why this priority**: toda cobrança e todo pagamento pertencem a uma pessoa.

**Independent Test**: criar, listar, renomear e remover pessoas.

**Acceptance Scenarios**:

1. **Given** a pessoa está autenticada, **When** cadastra "Sogro", **Then** ele aparece na lista de
   pessoas com saldo devedor zero.
2. **Given** já existe "Sogro", **When** tenta cadastrar " sogro ", **Then** é recusado com a
   mensagem "Já existe uma pessoa com esse nome.".
3. **Given** uma pessoa sem cobranças nem pagamentos, **When** é removida, **Then** some da lista.
4. **Given** uma pessoa com cobranças ou pagamentos, **When** a família tenta removê-la, **Then** é
   recusado com mensagem em português.

---

### User Story 2 - Marcar despesas como de uma pessoa (Priority: P1)

Ao registrar (ou editar) uma despesa, a família indica que ela é de uma pessoa (toda ou uma parte).
Cada parcela da despesa vira uma cobrança para essa pessoa no mês da parcela.

**Why this priority**: é o caso principal: o sogro e a esposa usam o cartão da família.

**Independent Test**: marcar uma despesa parcelada como do sogro e conferir as cobranças dele mês a
mês.

**Acceptance Scenarios**:

1. **Given** existe a pessoa "Sogro", **When** a família registra "Peças do carro", R$ 1.500,00 em
   10x a partir de 05/01/2027, marcada como do sogro, **Then** o sogro passa a ter uma cobrança de
   R$ 150,00 em cada mês de janeiro a outubro de 2027, identificada como "Peças do carro (n/10)".
2. **Given** a esposa gastou R$ 400,00 num jantar em que só metade é dela, **When** a família marca
   a despesa como da esposa com 50%, **Then** a esposa tem uma cobrança de R$ 200,00 naquele mês.
3. **Given** uma despesa marcada como do sogro, **When** a família desmarca, troca a pessoa, muda o
   percentual, ou edita valor/parcelas da despesa, **Then** as cobranças passam a refletir a
   despesa atualizada.
4. **Given** uma despesa marcada como do sogro, **When** a família remove a despesa, **Then** as
   cobranças dela somem da conta do sogro.
5. **Given** a despesa continua sendo da família, **When** a família consulta suas despesas e o
   resumo do mês, **Then** a despesa aparece normalmente nas saídas (a parcela é paga pela família).
6. **Given** a conta fixa "Celular do sogro", R$ 80,00 todo dia 10, marcada como do sogro,
   **When** a família consulta a conta dele em qualquer mês do período da conta fixa, **Then** vê
   uma cobrança de R$ 80,00 naquele mês; num mês ajustado para R$ 95,00, a cobrança é de R$ 95,00;
   num mês pulado, não há cobrança.
7. **Given** a conta fixa é encerrada, desmarcada ou removida, **When** a família consulta a conta
   do sogro, **Then** as cobranças dos meses que deixaram de existir somem.

---

### User Story 3 - Cobranças avulsas (Priority: P2)

A família registra um valor que a pessoa deve sem que seja uma despesa lançada (ex.: dinheiro
emprestado), com descrição, valor, data e observação.

**Why this priority**: complementa as despesas marcadas; menos frequente.

**Independent Test**: registrar, editar e remover uma cobrança avulsa e conferir o saldo da pessoa.

**Acceptance Scenarios**:

1. **Given** a pessoa "Esposa", **When** a família registra "Empréstimo em dinheiro", R$ 300,00,
   em 10/12/2026, **Then** a esposa tem uma cobrança de R$ 300,00 em dezembro/2026.
2. **Given** uma cobrança avulsa, **When** é editada ou removida, **Then** o saldo da pessoa é
   recalculado.
3. **Given** valor zero/negativo, descrição em branco ou data ausente, **When** a família envia,
   **Then** é recusado com todas as mensagens em português.

---

### User Story 4 - Registrar pagamentos e acompanhar o saldo da pessoa (Priority: P1)

A família registra cada valor que a pessoa mandou e consulta, mês a mês, quanto ela deve: saldo
anterior, cobranças do mês, pagamentos e o saldo que passa para o mês seguinte.

**Why this priority**: é o resumo pedido ("o total que ele tem que me mandar") e a regra de saldo
que passa adiante usada hoje na planilha.

**Independent Test**: com cobranças em vários meses, registrar pagamentos parciais e conferir o
extrato e o saldo de cada mês.

**Acceptance Scenarios**:

1. **Given** o sogro deve R$ 150,00 em dezembro e não tem saldo anterior, **When** manda
   R$ 100,00 em dezembro, **Then** dezembro fecha com saldo de R$ 50,00, e janeiro mostra saldo
   anterior de R$ 50,00 + cobranças de janeiro.
2. **Given** a esposa tinha saldo anterior de R$ 300,00 e cobranças de R$ 850,00 em dezembro,
   **When** manda R$ 900,00, **Then** dezembro mostra total devido de R$ 1.150,00, pago R$ 900,00 e
   saldo de R$ 250,00 que passa para janeiro.
3. **Given** a pessoa manda mais do que deve, **When** a família consulta, **Then** o saldo aparece
   como crédito (negativo) e abate as cobranças dos meses seguintes.
4. **Given** um pagamento sem cobranças escolhidas, **When** a família consulta as cobranças,
   **Then** cada cobrança mostra se está paga, parcialmente paga (quanto falta) ou em aberto, com o
   pagamento abatido das cobranças mais antigas para as mais novas.
5. **Given** o sogro deve R$ 50,00 de novembro e R$ 150,00 da parcela de dezembro das peças,
   **When** manda R$ 150,00 e a família escolhe a parcela das peças, **Then** a parcela das peças
   fica paga e os R$ 50,00 de novembro continuam em aberto; o saldo total é o mesmo que no
   abatimento automático.
6. **Given** a família escolhe cobranças que somam menos que o pagamento, **When** registra,
    **Then** as escolhidas ficam pagas e a sobra abate as cobranças mais antigas em aberto (e, se
    ainda sobrar, vira crédito).
7. **Given** a família escolhe cobranças que somam mais que o pagamento, **When** registra,
    **Then** o pagamento abate as escolhidas na ordem cronológica delas até acabar, e a última fica
    parcialmente paga.
8. **Given** a família escolhe uma cobrança já paga, de outra pessoa ou inexistente, **When**
    registra, **Then** é recusado com mensagem em português.
9. **Given** um pagamento registrado por engano, **When** a família o edita ou remove, **Then**
   saldos e situação das cobranças são recalculados.
10. **Given** a família consulta a lista de pessoas, **When** abre, **Then** vê para cada uma o saldo
   devedor atual (até hoje) e quanto ela deve no mês atual.
11. **Given** a família consulta um mês futuro de uma pessoa, **When** abre o extrato, **Then** vê as
   cobranças previstas daquele mês somadas ao saldo previsto que vem dos meses anteriores.
12. **Given** valor de pagamento zero/negativo, data futura ou data ausente, **When** a família
   envia, **Then** é recusado com mensagem em português.

---

**Resumo geral da pessoa** (parte da US4):

```text
Sogro — resumo                     Parcelas   Total       Pago       Falta
  Peças do carro (cartão)          3/10       1.500,00    450,00     1.050,00
  Pneu (cartão)                    0/3          600,00      0,00       600,00
  Celular (conta fixa, mensal)     3 meses      240,00    160,00        80,00
  Empréstimo em dinheiro           —            300,00    300,00         0,00
  ─────────────────────────────────────────────────────────────────────────
  Deve até hoje ..................................................   R$    80,00
  Deve no total (com parcelas futuras) ...........................   R$ 1.730,00
```

13. **Given** o sogro tem compras parceladas, uma conta fixa e uma cobrança avulsa, **When** a
    família abre o resumo dele, **Then** vê uma linha por origem com descrição, quantidade de
    parcelas (vencidas / total), total, pago e quanto falta, e os totais "deve até hoje" e "deve no
    total".
14. **Given** uma conta fixa sem data final, **When** aparece no resumo, **Then** mostra o valor
    mensal e soma só os meses até o atual (não há total futuro infinito).

---

### User Story 5 - Reembolsos no resumo do mês da família (Priority: P2)

O que as pessoas devem e o que elas mandam aparece no resumo do mês da família (feature 003).

**Why this priority**: sem isso, o saldo da família fica pessimista (a parcela do sogro sai, mas o
dinheiro que ele manda não entra).

**Independent Test**: com cobranças e pagamentos, consultar o resumo do mês e o acumulado.

**Acceptance Scenarios**:

1. **Given** o sogro tem cobranças de R$ 150,00 em dezembro, **When** a família consulta o resumo
   de dezembro, **Then** vê nas entradas um item "Reembolso — Sogro" de R$ 150,00 previsto, e o
   saldo previsto do mês aumenta R$ 150,00.
2. **Given** o sogro mandou R$ 100,00 em dezembro, **When** a família consulta o resumo de
   dezembro, **Then** o realizado mostra R$ 100,00 recebidos de reembolso.
3. **Given** a esposa terminou novembro devendo R$ 250,00, **When** a família consulta o resumo do
   mês atual (dezembro), **Then** as pendências a receber incluem "Reembolso — Esposa" de
   R$ 250,00, que entram no acumulado.
4. **Given** a esposa manda os R$ 250,00 em dezembro, **When** a família consulta, **Then** a
   pendência some, o realizado de dezembro aumenta R$ 250,00 e o saldo acumulado ao fim de
   dezembro não muda (o dinheiro esperado chegou).
5. **Given** a pessoa tem crédito (mandou a mais), **When** a família consulta o mês atual,
   **Then** o crédito reduz as pendências a receber (o dinheiro já entrou antes).
6. **Given** a família filtra o resumo por categoria, **When** consulta, **Then** os reembolsos não
   aparecem (não pertencem a categoria).

---

### Edge Cases

- Pagamento antes de existir cobrança gera crédito para a pessoa.
- Se uma cobrança escolhida num pagamento deixar de existir ou diminuir (ex.: a despesa foi
  editada ou removida), a parte do pagamento que ficou sem destino abate as cobranças mais antigas
  em aberto, sem nenhuma ação da família.
- A escolha de cobranças muda só o que aparece como pago em cada item; o saldo da pessoa em cada
  mês é sempre saldo anterior + cobranças − pagamentos.
- Cobrança de despesa marcada usa o valor da parcela; se a parcela foi amortizada com desconto, a
  pessoa deve a parte proporcional ao valor efetivamente pago (o desconto também é dela).
- Percentual com sobra de centavos: a cobrança é arredondada para o centavo, e a soma das cobranças
  de uma despesa nunca passa da parte da pessoa no total.
- Uma despesa ou conta fixa pode ser de no máximo uma pessoa nesta versão.
- Não há marcação automática por categoria: cada despesa ou conta fixa é marcada individualmente.
- O mês de uma cobrança de despesa segue a regra das parcelas (feature 002): mês do vencimento, ou
  mês do pagamento quando a parcela foi antecipada.
- O mês de um pagamento é o da data do pagamento.
- Saldo anterior do primeiro mês com movimento é zero.
- Nome de pessoa é único ignorando maiúsculas/minúsculas e espaços nas pontas.
- Remover a pessoa marcada numa despesa é recusado (a despesa precisa ser desmarcada antes).
- Valores com mais de 2 casas decimais são recusados.
- No resumo da família, um pagamento é realizado no mês da sua data, mesmo que abata cobranças de
  outros meses.
- Toda operação exige estar autenticado.

## Requirements *(mandatory)*

### Functional Requirements

**Pessoas**

- **FR-001**: O sistema MUST permitir cadastrar, listar, renomear e remover pessoas (nome
  obrigatório, até 50 caracteres, único ignorando maiúsculas e espaços nas pontas).
- **FR-002**: O sistema MUST recusar a remoção de pessoa com cobranças, pagamentos ou despesas
  marcadas.
- **FR-003**: A lista de pessoas MUST mostrar, para cada uma, o saldo devedor até hoje e o total
  devido no mês atual (saldo anterior + cobranças do mês − pagamentos do mês).

**Despesas marcadas**

- **FR-004**: Ao registrar ou editar uma despesa, o sistema MUST permitir indicar uma pessoa e a
  parte dela: integral (padrão) ou um percentual entre 1% e 100%.
- **FR-005**: Cada parcela de uma despesa marcada MUST gerar uma cobrança para a pessoa, no mês de
  referência da parcela, com valor = valor da parcela (ou o efetivamente pago, se paga) × percentual,
  arredondado ao centavo.
- **FR-006**: As cobranças de uma despesa marcada MUST acompanhar sempre a despesa (edição,
  recálculo de parcelas, amortização, desmarcação e remoção), sem lançamento manual.
- **FR-021**: O sistema MUST permitir marcar uma conta fixa recorrente (feature 003, tipo despesa)
  como de uma pessoa, integral ou com percentual; cada ocorrência mensal MUST gerar uma cobrança no
  mês da ocorrência, com valor = valor da ocorrência × percentual, acompanhando ajustes, pulos,
  mudanças de valor, encerramento, desmarcação e remoção. Receitas recorrentes não podem ser
  marcadas.
- **FR-007**: A despesa marcada MUST continuar sendo despesa da família em todas as consultas da
  feature 002 e nas saídas do resumo do mês.

**Cobranças avulsas**

- **FR-008**: O sistema MUST permitir registrar, editar e remover cobranças avulsas de uma pessoa,
  com descrição (obrigatória, até 100 caracteres), valor (maior que zero, até 2 casas), data
  (obrigatória) e observação opcional (até 500 caracteres).

**Pagamentos e saldo**

- **FR-009**: O sistema MUST permitir registrar, editar e remover pagamentos de uma pessoa, com
  valor (maior que zero, até 2 casas), data (obrigatória, não futura) e observação opcional.
- **FR-010**: O extrato de uma pessoa para qualquer mês (passado, atual ou futuro; padrão o mês
  atual) MUST mostrar: saldo anterior, lista de cobranças do mês, total devido (saldo anterior +
  cobranças), lista de pagamentos do mês, total pago e saldo final do mês.
- **FR-011**: O saldo final de um mês MUST ser o saldo anterior do mês seguinte (o que não foi pago
  passa adiante; crédito também).
- **FR-012**: Ao registrar ou editar um pagamento, a família MAY escolher as cobranças que ele
  quita (só cobranças da pessoa ainda não totalmente pagas). O pagamento MUST abater primeiro as
  escolhidas, em ordem cronológica, até o valor de cada uma em aberto; a sobra (ou o pagamento todo,
  sem escolha) MUST abater as demais cobranças em aberto da mais antiga para a mais nova; o que ainda
  sobrar MUST virar crédito, abatido das cobranças seguintes. Os pagamentos são aplicados em ordem
  de data.
- **FR-022**: Cada cobrança MUST mostrar sua situação (paga, parcialmente paga com o valor que
  falta, ou em aberto) e quais pagamentos a abateram.
- **FR-023**: O sistema MUST oferecer um resumo geral por pessoa com uma linha por origem (despesa
  marcada, conta fixa marcada, cobrança avulsa): descrição, quantidade de cobranças vencidas até o
  mês atual e total de cobranças, valor total, valor pago (pela regra de abatimento), valor que
  falta; e os totais "deve até hoje" (cobranças até o mês atual − pagamentos) e "deve no total"
  (incluindo cobranças futuras de despesas parceladas e de contas fixas com mês final). Contas
  fixas sem mês final entram só até o mês atual e mostram o valor mensal.
- **FR-013**: Saldos e situações MUST ser sempre recalculados a partir das cobranças e pagamentos,
  refletindo imediatamente qualquer alteração.

**Resumo da família**

- **FR-014**: O resumo do mês da família (feature 003) MUST incluir os reembolsos como entradas:
  um item por pessoa com cobranças no mês, com valor previsto = total das cobranças do mês da
  pessoa; o realizado de reembolsos do mês = total dos pagamentos recebidos no mês.
- **FR-018**: No mês atual, as pendências a receber MUST incluir, por pessoa, o saldo líquido dela
  ao fim do mês anterior (dívida positiva soma; crédito subtrai), entrando no saldo acumulado como
  as demais pendências.
- **FR-019**: Para o acumulado, meses encerrados MUST contar os pagamentos recebidos (realizado), e
  o mês atual e os futuros MUST contar as cobranças do mês (previsto), seguindo a regra da feature
  003; um pagamento recebido no mês atual de uma dívida antiga MUST reduzir a pendência sem alterar
  o saldo acumulado ao fim do mês.
- **FR-020**: Com filtro de categoria, o resumo MUST omitir os reembolsos.

**Gerais**

- **FR-015**: Todas as funcionalidades MUST exigir credencial de acesso válida.
- **FR-016**: Todas as mensagens ao usuário MUST estar em português, e erros de validação MUST ser
  devolvidos todos de uma vez.
- **FR-017**: Valores monetários MUST ter precisão exata de centavos.

### Key Entities

- **Pessoa**: alguém que deve dinheiro à família (nome único). Tem cobranças e pagamentos.
- **Marcação**: liga uma despesa (feature 002) ou uma conta fixa recorrente (feature 003) a uma
  pessoa, com a parte dela (integral ou percentual). Cada uma tem no máximo uma marcação.
- **Cobrança** (calculada para despesas marcadas; digitada para avulsas): pessoa, origem (parcela de
  despesa ou avulsa), descrição, mês, data e valor.
- **Pagamento**: pessoa, valor, data, observação e, opcionalmente, as cobranças escolhidas que ele
  quita.
- **Reembolso no resumo** (calculado): por pessoa e mês, total de cobranças (previsto) e de
  pagamentos (realizado), mais o saldo do mês anterior como pendência no mês atual.
- **Extrato do mês** (calculado): saldo anterior, cobranças, pagamentos e saldo final da pessoa no
  mês, com a situação de cada cobrança.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A família responde "quanto o sogro (ou a esposa) ainda me deve e quanto deve este
  mês?" com uma única consulta, sem fazer contas à mão.
- **SC-002**: Em 100% dos meses, saldo final = saldo anterior + cobranças − pagamentos, e o saldo
  anterior de um mês é igual ao saldo final do mês anterior.
- **SC-003**: O valor não pago num mês aparece no mês seguinte em 100% dos casos, sem nenhum
  lançamento manual.
- **SC-004**: Marcar uma despesa parcelada como de uma pessoa gera todas as cobranças mensais
  corretas em menos de 30 segundos de uso, sem lançar parcela por parcela.
- **SC-008**: A família responde "quanto falta de cada compra que o sogro fez no meu cartão?" com uma
  única consulta, e a soma das linhas do resumo bate com o total devido.
- **SC-005**: A soma das cobranças de uma despesa marcada é sempre igual à parte da pessoa no total
  da despesa, sem diferença de centavos.
- **SC-007**: Com reembolsos, o saldo acumulado da família ao fim do mês atual não muda quando uma
  pessoa paga uma dívida antiga no mês (100% dos casos): só passa de pendência para realizado.
- **SC-006**: 100% das mensagens exibidas ao usuário nesta funcionalidade estão em português.

## Assumptions

- Depende das features 001, 002 (despesas e parcelas) e 003 (resumo do mês).
- Uma despesa pode ser de no máximo uma pessoa; divisão de uma mesma despesa entre várias pessoas
  fica para depois.
- As pessoas não acessam o sistema: só a família registra cobranças e pagamentos.
- Não há juros, multa ou desconto sobre dívidas de terceiros.
- Não há envio de cobrança ou lembrete para a pessoa (ex.: mensagem); a família consulta o extrato e
  combina por fora.
- Fora de escopo: divisão de uma despesa entre várias pessoas, contas bancárias, notificações,
  relatórios com gráficos, frontend.
