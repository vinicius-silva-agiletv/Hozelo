# Feature Specification: Receitas e Saldo Mensal

**Feature Branch**: `003-incomes-monthly-balance`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Receitas e saldo mensal. Registrar, editar, listar e remover receitas
(entradas de dinheiro da família): nome, valor, data de recebimento, categoria e observação
opcional. Receitas podem ser avulsas (ex.: décimo terceiro, venda de algo) ou recorrentes mensais
(ex.: salário), que aparecem automaticamente todo mês a partir de uma data, com dia de
recebimento; é possível ajustar o valor de um mês específico ou alterar o valor dali em diante, e
encerrar a recorrência. A visão mensal passa a mostrar entradas (receitas do mês), saídas
(parcelas do mês da feature 002) e o saldo do mês (entradas − saídas), para qualquer mês (atual,
próximos e anteriores). Categorias da feature 002 passam a servir também para receitas (decidir
se separadas por tipo). Fora de escopo: valores a receber de terceiros/reembolsos (esposa,
sogro), que serão a feature 004; contas bancárias; relatórios com gráficos."

## Clarifications

### Session 2026-11-21

- Q: A receita tem situação "prevista" / "recebida" ou todo lançamento conta como recebido? → A:
  Prevista / recebida; a família confirma o recebimento (como marca uma parcela como paga) e o mês
  mostra saldo previsto e saldo realizado.
- Q: As categorias passam a ser separadas por tipo (despesa / receita)? → A: Sim, separadas por
  tipo; as existentes viram despesa e o nome é único dentro do tipo.
- Q: O que sobra (ou falta) num mês passa para o mês seguinte como saldo acumulado? → A: Sim, a
  partir de um saldo inicial informado pela família; meses já encerrados acumulam o realizado e o
  mês atual e os futuros acumulam o previsto. (O acúmulo da dívida de terceiros, em que o que a pessoa não
  pagou soma com a dívida do mês seguinte, é regra da feature 004.)
- Q: Contas fixas mensais (internet, luz, água, assinaturas) também podem ser recorrentes? → A: Sim,
  nesta feature: despesas recorrentes mensais com as mesmas regras do salário; cada mês gera uma
  conta a pagar que entra nas saídas e pode ser marcada como paga.
- Q: No acumulado, o mês atual entra pelo realizado ou pelo previsto? → A: Pelo previsto: o mês atual
  é planejado por inteiro, contando tudo o que entra ou vence até o fim dele, mesmo o que ainda não
  aconteceu; o acumulado do mês atual é a projeção de fechamento do mês.
- Q: Contas não pagas e receitas não recebidas de meses encerrados entram no acumulado? → A: Sim:
  continuam no mês delas (a pagar / previstas) e o valor pendente entra no previsto do mês atual,
  numa linha "pendências de meses anteriores"; ao serem pagas ou recebidas, saem dali.

## Visão geral do modelo

Há dois tipos de receita:

| Tipo | Exemplo | Como aparece nos meses |
|---|---|---|
| **Avulsa** | 13º salário, venda de um móvel | uma única vez, no mês da data de recebimento |
| **Recorrente mensal** | salário | todo mês, no dia de recebimento, a partir do mês inicial e até ser encerrada |

As mesmas regras de recorrência valem para **contas fixas** (internet, luz, água, assinaturas):
uma **despesa recorrente** gera todo mês uma conta a pagar, que entra nas saídas do mês e é marcada
como paga, como uma parcela.

Uma receita (ou despesa) recorrente é uma "regra" que gera uma **ocorrência** por mês. A família pode mexer
numa ocorrência sem afetar as outras:

- **ajustar só um mês** (ex.: salário de dezembro veio menor) ou **pular um mês** (não recebeu);
- **mudar o valor dali em diante** (ex.: aumento a partir de março), mantendo os meses anteriores
  como estavam;
- **encerrar** a recorrência a partir de um mês (ex.: mudou de emprego), mantendo o histórico.

A visão mensal da feature 002 passa a ser o **resumo do mês**:

```text
Novembro/2026                     Previsto       Realizado
  Entradas (receitas do mês) ..  R$ 8.500,00    R$ 6.000,00   (recebidas)
  Saídas (parcelas do mês) ....  R$ 6.120,00    R$ 4.870,00   (pagas)
  ─────────────────────────────────────────────────────────
  Saldo do mês ................  R$ 2.380,00    R$ 1.130,00
```

Com o **saldo acumulado**, o que sobra (ou falta) num mês passa para o seguinte, a partir de um
**saldo inicial** informado uma vez pela família (ex.: "em 01/11/2026 tínhamos R$ 3.200,00"):

```text
Dezembro/2026
  Saldo anterior (acumulado até novembro) ..  R$ 1.000,00
  Saldo do mês (entradas − saídas) .........  −R$ 500,00
  ─────────────────────────────────────────
  Saldo acumulado ao fim de dezembro .......  R$   500,00
```

Meses já encerrados acumulam o **realizado** (o que de fato entrou menos o que de fato foi pago).
O mês atual e os futuros acumulam o **previsto**: o mês atual é planejado por inteiro, contando
tudo o que entra ou vence até o fim dele, e o acumulado mostra com antecedência como o mês vai
fechar e se vai faltar dinheiro.

Cada receita (avulsa ou ocorrência de recorrente) fica **prevista** até a família confirmar que o
dinheiro entrou, quando passa a **recebida** (com a data do recebimento), da mesma forma que uma
parcela é marcada como paga.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar receitas avulsas (Priority: P1)

A família registra uma entrada pontual de dinheiro (13º, venda de algo, um bico) com nome, valor,
data de recebimento, categoria e observação opcional, e consegue listar, corrigir e remover.

**Why this priority**: é a forma mais simples de receita e já permite começar a montar o saldo.

**Independent Test**: registrar, listar, editar e remover receitas avulsas.

**Acceptance Scenarios**:

1. **Given** existe a categoria de receita "13º salário", **When** a pessoa registra
   "13º - primeira parcela", R$ 2.500,00, recebida em 30/11/2026, **Then** a receita aparece na
   lista e no mês de novembro/2026.
2. **Given** uma receita avulsa, **When** a pessoa altera valor ou data, **Then** ela passa a
   aparecer com o novo valor e no mês da nova data.
3. **Given** uma receita avulsa, **When** a pessoa a remove, **Then** ela deixa de aparecer na
   lista e nos meses.
4. **Given** a pessoa informa valor zero/negativo, nome em branco, data ausente ou categoria
   inexistente, **When** envia, **Then** o registro é recusado com todas as mensagens em
   português de uma vez.

---

### User Story 2 - Receitas recorrentes, como o salário (Priority: P1)

A família cadastra o salário uma vez (valor, dia de recebimento, mês inicial) e ele passa a
aparecer sozinho em todos os meses, sem precisar lançar de novo.

**Why this priority**: o salário é a principal entrada da família; lançar todo mês à mão é
justamente o trabalho que se quer evitar.

**Independent Test**: cadastrar uma receita recorrente e consultar vários meses (passados,
atual e futuros).

**Acceptance Scenarios**:

1. **Given** a pessoa cadastra "Salário", R$ 6.000,00, todo dia 5, a partir de janeiro/2026,
   **When** consulta qualquer mês de janeiro/2026 em diante, **Then** vê uma entrada "Salário" de
   R$ 6.000,00 no dia 5 daquele mês.
2. **Given** o mesmo salário, **When** consulta dezembro/2025 (antes do início), **Then** não vê o
   salário.
3. **Given** um salário recebido todo dia 31, **When** consulta fevereiro, **Then** a entrada
   aparece no último dia do mês.
4. **Given** o salário de dezembro/2026 veio R$ 5.400,00, **When** a pessoa ajusta só dezembro,
   **Then** dezembro mostra R$ 5.400,00 e os demais meses continuam com R$ 6.000,00.
5. **Given** a pessoa não recebeu em um mês, **When** pula aquele mês, **Then** o salário não
   aparece naquele mês e continua nos outros.
6. **Given** a pessoa teve aumento para R$ 6.600,00 a partir de março/2027, **When** altera o
   valor dali em diante, **Then** de março/2027 em diante aparece R$ 6.600,00 e os meses
   anteriores continuam com o valor antigo (inclusive ajustes já feitos).
7. **Given** a pessoa mudou de emprego, **When** encerra a recorrência em junho/2027 (último mês
   recebido), **Then** o salário aparece até junho/2027 e não aparece mais a partir de julho; os
   meses anteriores continuam visíveis.
8. **Given** um ajuste ou pulo feito por engano, **When** a pessoa desfaz, **Then** o mês volta a
   seguir a regra da recorrência.

---

### User Story 3 - Saldo do mês (Priority: P1)

A família consulta qualquer mês e vê, juntos, o que entra, o que sai e quanto sobra (ou falta).

**Why this priority**: é a pergunta central da planilha: "quanto sobra este mês?".

**Independent Test**: com receitas e despesas cadastradas, consultar meses e conferir entradas,
saídas e saldo.

**Acceptance Scenarios**:

1. **Given** em novembro há salário de R$ 6.000,00, 13º de R$ 2.500,00 e parcelas somando
   R$ 6.120,00, **When** a pessoa consulta novembro, **Then** vê entradas de R$ 8.500,00, saídas
   de R$ 6.120,00 e saldo de R$ 2.380,00, com a lista de entradas e de saídas.
2. **Given** um mês em que as saídas passam as entradas, **When** a pessoa consulta, **Then** o
   saldo aparece negativo.
3. **Given** a pessoa consulta um mês futuro, **When** abre o resumo, **Then** vê a previsão
   daquele mês (salários recorrentes e parcelas que vão vencer).
4. **Given** a pessoa filtra o mês por uma categoria, **When** consulta, **Then** entradas e
   saídas consideram só aquela categoria.
5. **Given** um mês sem receitas nem parcelas, **When** a pessoa consulta, **Then** vê tudo zerado.
6. **Given** em novembro o salário (R$ 6.000,00) já foi recebido, o 13º (R$ 2.500,00) ainda não,
   e R$ 4.870,00 das parcelas foram pagas, **When** a pessoa consulta novembro, **Then** vê o
   saldo previsto de R$ 2.380,00 e o saldo realizado de R$ 1.130,00 (recebido − pago).
7. **Given** uma receita prevista, **When** a pessoa confirma o recebimento (com a data de hoje ou
   outra data não futura), **Then** ela passa a recebida e entra no realizado; **When** desfaz,
   **Then** volta a prevista.
8. **Given** a ocorrência do salário de dezembro, **When** a pessoa confirma o recebimento só
   dela, **Then** os outros meses continuam previstos.
9. **Given** o saldo inicial de R$ 3.200,00 em 01/11/2026 e o saldo realizado de novembro de
   −R$ 2.200,00, **When** a pessoa consulta dezembro, **Then** vê o saldo anterior de R$ 1.000,00 e
   o saldo acumulado ao fim de dezembro = R$ 1.000,00 + saldo de dezembro.
10. **Given** a pessoa consulta um mês futuro, **When** abre o resumo, **Then** o saldo anterior
    soma o realizado dos meses já encerrados e o previsto do mês atual e dos meses futuros
    intermediários.
11. **Given** um pagamento ou recebimento confirmado num mês passado, **When** a pessoa consulta
    os meses seguintes, **Then** os acumulados de todos eles já refletem a mudança.
12. **Given** hoje é dia 21 e a internet de R$ 120,00 vence dia 25, ainda a pagar, **When** a
    pessoa consulta o mês atual, **Then** o acumulado ao fim do mês já desconta os R$ 120,00.
13. **Given** ainda não há saldo inicial, **When** a pessoa consulta um mês, **Then** vê os saldos
    do mês normalmente e o acumulado vazio, com a indicação de que falta informar o saldo inicial.
14. **Given** a pessoa consulta um mês anterior ao do saldo inicial, **When** abre o resumo,
    **Then** vê o saldo do mês, sem acumulado.
15. **Given** a internet de outubro (R$ 120,00) ficou a pagar e o 13º de outubro (R$ 500,00) não
    chegou, **When** a pessoa consulta novembro (mês atual), **Then** vê a linha "pendências de
    meses anteriores" com R$ 120,00 a pagar e R$ 500,00 a receber, que entram no previsto de
    novembro; **When** paga a internet de outubro, **Then** ela sai das pendências, entra no
    realizado de outubro e o acumulado fica igual.

---

### User Story 4 - Categorias separadas por tipo (Priority: P2)

As categorias passam a ser de despesa ou de receita, para que "Salário" não apareça entre as
categorias de despesa e vice-versa.

**Why this priority**: organização; sem isso a feature funciona, mas as listas ficam misturadas.

**Independent Test**: criar categorias dos dois tipos e conferir que cada lançamento só aceita
o tipo certo.

**Acceptance Scenarios**:

1. **Given** a pessoa cria a categoria "Salário" do tipo receita, **When** lista as categorias de
   receita, **Then** ela aparece; **When** lista as de despesa, **Then** ela não aparece.
2. **Given** uma categoria de despesa, **When** a pessoa tenta usá-la numa receita (ou o
   contrário), **Then** o registro é recusado com mensagem em português.
3. **Given** as categorias que já existiam antes desta feature, **When** a feature entra no ar,
   **Then** todas passam a ser do tipo despesa, sem perder nenhuma despesa.
4. **Given** já existe a despesa "Carro" e a pessoa cria a receita "Carro" (ex.: venda),
   **When** salva, **Then** é aceito, pois os nomes só precisam ser únicos dentro do mesmo tipo.

---

### User Story 5 - Contas fixas recorrentes (Priority: P2)

A família cadastra uma vez as contas que se repetem todo mês (internet, luz, água, assinaturas),
com valor estimado e dia de vencimento, e elas passam a aparecer como contas a pagar em todos os
meses, entrando nas saídas e no saldo previsto.

**Why this priority**: sem elas, a previsão dos meses futuros e o acumulado previsto ficam
otimistas demais; depende das mesmas regras de recorrência da US2.

**Independent Test**: cadastrar uma conta fixa, consultar meses futuros e passados, ajustar o
valor de um mês e marcá-lo como pago.

**Acceptance Scenarios**:

1. **Given** a pessoa cadastra "Internet", R$ 120,00, vencendo todo dia 15, a partir de
   novembro/2026, na categoria de despesa "Internet", **When** consulta qualquer mês a partir de
   novembro/2026, **Then** vê uma saída "Internet" de R$ 120,00 no dia 15, a pagar.
2. **Given** a conta de luz de dezembro veio R$ 287,40 (estimativa R$ 250,00), **When** a pessoa
   ajusta só dezembro, **Then** dezembro mostra R$ 287,40 e os outros meses R$ 250,00.
3. **Given** a conta de dezembro, **When** a pessoa a marca como paga, **Then** ela entra no total
   pago e no saldo realizado de dezembro; os outros meses continuam a pagar.
4. **Given** a pessoa cancelou uma assinatura, **When** encerra a recorrência no último mês pago,
   **Then** a conta não aparece mais nos meses seguintes.
5. **Given** uma conta fixa de outubro paga com atraso em novembro, **When** a pessoa consulta,
   **Then** ela continua em outubro, marcada como paga (mesma regra das parcelas: o mês de
   referência é o do vencimento).
6. **Given** a pessoa tenta cadastrar uma conta fixa com categoria de receita, **When** salva,
   **Then** é recusado com mensagem em português.

---

### Edge Cases

- Receita recorrente com dia 29, 30 ou 31: nos meses sem esse dia, cai no último dia do mês
  (mesma regra das parcelas).
- Mudar o valor dali em diante a partir de um mês que já tinha ajuste: o ajuste daquele mês
  prevalece (é a exceção daquele mês); os meses seguintes seguem o novo valor.
- Mudar o valor dali em diante mais de uma vez: cada mudança vale a partir do seu mês, até a
  próxima.
- Encerrar a recorrência antes do mês inicial é recusado; encerrar num mês em que já estava
  encerrada só atualiza o mês final.
- Reabrir uma recorrência encerrada (remover o mês final) volta a gerar os meses seguintes.
- Ajustar ou pular um mês fora do período da recorrência é recusado.
- Remover uma receita recorrente apaga todos os seus meses, inclusive os passados; para manter o
  histórico, usa-se encerrar.
- Remover uma categoria de receita com receitas vinculadas é recusado, como nas despesas.
- Receita avulsa com data no passado ou no futuro é aceita.
- Valores com mais de 2 casas decimais são recusados.
- Toda operação exige estar autenticado.
- Pendências só aparecem no mês atual; meses futuros não repetem a linha (o valor já está no
  acumulado do mês atual). Meses passados mostram seus itens pendentes como a pagar / previstos.
- Ajustar o valor de uma ocorrência já recebida é permitido (corrige o valor recebido); pular uma
  ocorrência recebida é recusado (é preciso desfazer o recebimento antes).
- Mudar o valor dali em diante não altera ocorrências já recebidas.
- Encerrar a recorrência antes de um mês que já tem recebimento confirmado é recusado.

## Requirements *(mandatory)*

### Functional Requirements

**Categorias**

- **FR-001**: Toda categoria MUST ter um tipo: despesa ou receita.
- **FR-002**: As categorias existentes antes desta feature MUST passar a ser do tipo despesa.
- **FR-003**: O nome da categoria MUST ser único por tipo (ignorando maiúsculas e espaços nas
  pontas), em vez de único no geral.
- **FR-004**: A lista de categorias MUST permitir filtrar por tipo e informar a quantidade de
  lançamentos (despesas ou receitas) de cada uma.
- **FR-005**: Despesas MUST aceitar apenas categorias de despesa, e receitas apenas categorias
  de receita.
- **FR-006**: O tipo de uma categoria MUST NOT ser alterado depois de criada.

**Receitas avulsas**

- **FR-007**: O sistema MUST permitir registrar, consultar, editar e remover receitas avulsas
  com nome (obrigatório, até 100 caracteres), valor (maior que zero, até 2 casas decimais), data
  de recebimento (obrigatória), categoria de receita (obrigatória) e observação opcional (até 500
  caracteres).
- **FR-008**: Toda receita avulsa e toda ocorrência de receita recorrente MUST ter a situação
  "prevista" ou "recebida". O sistema MUST permitir confirmar o recebimento (data padrão hoje, não
  futura) e desfazê-lo; confirmar o que já está recebido ou desfazer o que está previsto não altera
  nada. Ao registrar uma receita avulsa, a família MAY informá-la já como recebida.

**Receitas recorrentes**

- **FR-009**: O sistema MUST permitir cadastrar uma receita recorrente mensal com nome,
  categoria de receita, valor, dia de recebimento (1–31), mês inicial, mês final opcional e
  observação opcional.
- **FR-010**: Uma receita recorrente MUST gerar uma ocorrência em cada mês entre o mês inicial e
  o mês final (ou sem fim), no dia de recebimento, limitado ao último dia do mês.
- **FR-011**: O sistema MUST permitir ajustar o valor de uma ocorrência específica, pular uma
  ocorrência e desfazer o ajuste ou o pulo.
- **FR-012**: O sistema MUST permitir alterar o valor da recorrência a partir de um mês, sem
  alterar os meses anteriores nem os ajustes de meses específicos.
- **FR-013**: O sistema MUST permitir encerrar a recorrência informando o último mês, e reabri-la.
- **FR-014**: O sistema MUST permitir editar nome, categoria, observação e dia de recebimento da
  recorrência (valendo para todos os meses) e removê-la por completo.
- **FR-015**: O sistema MUST listar as receitas avulsas e as recorrentes, com filtro opcional por
  categoria; as recorrentes mostram valor atual, dia, mês inicial, mês final e situação (ativa /
  encerrada).

**Despesas recorrentes (contas fixas)**

- **FR-026**: O sistema MUST permitir cadastrar despesas recorrentes mensais com as mesmas
  informações e operações das receitas recorrentes (FR-009 a FR-015): categoria de despesa, valor,
  dia de vencimento, mês inicial e final, ajuste e pulo de um mês, valor dali em diante, encerrar,
  reabrir, editar e remover.
- **FR-027**: Cada ocorrência de despesa recorrente MUST ter a situação "a pagar" ou "paga", com
  marcar como paga (data padrão hoje, não futura) e desfazer, e as mesmas restrições das receitas
  recebidas (não pular uma ocorrência paga; valor dali em diante não altera ocorrências pagas; não
  encerrar antes de um mês pago).
- **FR-028**: Uma ocorrência de despesa recorrente pertence ao mês do seu vencimento, mesmo quando
  paga em outro mês.

**Saldo do mês**

- **FR-016**: A visão mensal MUST mostrar, para qualquer mês (passado, atual ou futuro; padrão o
  mês atual): a lista de entradas (receitas avulsas do mês e ocorrências das recorrentes), a
  lista de saídas (parcelas do mês, com a mesma regra da feature 002, e ocorrências das despesas
  recorrentes do mês), o total de entradas, o
  total de saídas e o saldo (entradas − saídas), que pode ser negativo. Para cada entrada MUST
  indicar se está prevista ou recebida, e o mês MUST trazer também o **realizado**: total
  recebido, total pago e saldo realizado (recebido − pago).
- **FR-017**: A visão mensal MUST continuar permitindo filtrar por categoria, aplicando o filtro a
  entradas e saídas; com filtro de categoria, o saldo acumulado não é exibido (ele só faz sentido
  para a família inteira).
- **FR-022**: O sistema MUST permitir informar, consultar e alterar um único saldo inicial da
  família (valor, que pode ser negativo, e data de referência).
- **FR-023**: Para cada mês a partir do mês do saldo inicial, a visão mensal MUST mostrar o saldo
  anterior e o saldo acumulado ao fim do mês: saldo acumulado = saldo anterior + saldo do mês. O
  saldo anterior do mês do saldo inicial é o próprio saldo inicial; no mês do saldo inicial
  consideram-se apenas entradas e saídas com data a partir da data de referência.
- **FR-024**: Para o acúmulo, meses anteriores ao atual MUST usar o saldo realizado
  (recebido − pago); o mês atual e os meses futuros MUST usar o saldo previsto (entradas − saídas),
  de modo que o acumulado do mês atual seja a projeção de fechamento do mês.
- **FR-029**: Contas a pagar (parcelas e contas fixas) e receitas previstas de meses já encerrados,
  a partir do saldo inicial, MUST continuar no mês delas e ser somadas ao previsto do mês atual
  numa linha separada de "pendências de meses anteriores" (a pagar e a receber), listando os itens;
  ao serem pagas ou recebidas, MUST sair das pendências e entrar no realizado do mês delas, sem
  contar duas vezes no acumulado.
- **FR-025**: O acumulado MUST ser sempre recalculado a partir dos lançamentos, refletindo
  imediatamente qualquer alteração em meses anteriores.
- **FR-018**: Os totais de saídas, pago e em aberto da feature 002 MUST continuar disponíveis e
  com os mesmos valores.

**Gerais**

- **FR-019**: Todas as funcionalidades MUST exigir credencial de acesso válida.
- **FR-020**: Todas as mensagens ao usuário MUST estar em português, e erros de validação MUST ser
  devolvidos todos de uma vez.
- **FR-021**: Valores monetários MUST ter precisão exata de centavos.

### Key Entities

- **Categoria** (alterada): ganha o tipo (despesa ou receita); nome único dentro do tipo.
- **Receita avulsa**: nome, valor, data prevista de recebimento, categoria de receita, observação,
  situação (prevista / recebida) e data em que foi recebida.
- **Receita recorrente**: nome, categoria de receita, dia de recebimento, mês inicial, mês final
  opcional, observação; tem um histórico de valores (cada valor vale a partir de um mês).
- **Despesa recorrente** (conta fixa): mesma estrutura da receita recorrente, com categoria de
  despesa e dia de vencimento.
- **Ajuste de mês da recorrência**: registro de uma recorrência (receita ou despesa) em um mês
  específico: outro valor, pulo e/ou a confirmação daquele mês (data recebida ou paga).
- **Saldo inicial**: valor (pode ser negativo) e data de referência a partir da qual o saldo
  acumulado é calculado; existe no máximo um por conta.
- **Ocorrência** (calculada, não digitada): a entrada de uma recorrência em um mês, com data,
  valor e situação resultantes da regra, do histórico de valores e do ajuste do mês.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A família cadastra o salário uma única vez e ele aparece em 100% dos meses do
  período da recorrência, sem nenhum lançamento mensal manual.
- **SC-002**: A família responde "quanto sobra (ou falta) no mês X?" para qualquer mês com uma
  única consulta, e o saldo previsto é sempre igual a entradas − saídas e o realizado a
  recebido − pago, sem diferença de centavos.
- **SC-008**: Em 100% dos meses a partir do saldo inicial, saldo acumulado = saldo anterior +
  saldo do mês, e o saldo anterior de um mês é igual ao acumulado do mês anterior.
- **SC-003**: Mudar o valor do salário dali em diante não altera nenhum mês anterior (100% dos
  meses anteriores mantêm o valor e os ajustes que tinham).
- **SC-004**: Ajustar ou pular um mês afeta apenas aquele mês em 100% dos casos.
- **SC-005**: Registrar uma receita avulsa leva menos de 30 segundos, com no máximo 5 campos.
- **SC-006**: Nenhuma despesa existente é perdida ou alterada ao separar as categorias por tipo.
- **SC-007**: 100% das mensagens exibidas ao usuário nesta funcionalidade estão em português.

## Assumptions

- Depende das features 001 (conta e autenticação) e 002 (categorias, despesas, visão mensal).
- Contas fixas recorrentes não têm parcelas: cada mês é uma conta a pagar independente; a amortização
  da feature 002 não se aplica a elas.
- Recorrência só mensal; outras frequências (semanal, anual) ficam para depois.
- O 13º e outras entradas pontuais são receitas avulsas; não há geração automática do 13º.
- As saídas do saldo são as parcelas de despesas (feature 002) e as contas fixas recorrentes, com a mesma regra de mês: em dia
  ou atrasada no mês do vencimento; antecipada no mês do pagamento.
- Uma receita recebida em data diferente da prevista continua no mês da data prevista (o mês de
  referência é o do recebimento previsto); a data real fica registrada.
- O saldo acumulado é um único valor da família (não separa contas bancárias); meses anteriores ao
  saldo inicial não têm acumulado.
- Fora de escopo: valores a receber de terceiros e reembolsos (feature 004, incluindo o saldo
  devedor de uma pessoa que passa para o mês seguinte), contas bancárias e
  saldo acumulado de conta, transferências, relatórios com gráficos, frontend.
