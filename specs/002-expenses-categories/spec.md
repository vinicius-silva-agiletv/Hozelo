# Feature Specification: Despesas e Categorias

**Feature Branch**: `002-expenses-categories`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Registrar, editar, listar e remover despesas (nome, valor, é
parcelado?, quantidade de parcelas, parcelas pagas, parcelas faltantes, data da primeira
parcela, data da última parcela, valor da parcela, valor pago até o momento e quanto falta para
pagar, e uma observação caso queira colocar e qual categoria essa dívida pertence (se é cartão
x, ou empréstimo, dinheiro para guardar, ou venda de algo, enfim, parcela de carro, conta de
água, internet ou de luz). Conseguir registrar, editar, listar e remover categorias. Ver o que é
preciso e se é necessário quebrar a entidade de registrar despesas em outras menores, e ver a
relação de despesas com categorias."

## Clarifications

### Session 2026-11-21

- Q: Qual valor a família informa ao registrar uma despesa? → A: Pode escolher entre o valor
  total e o valor da parcela; o sistema calcula o outro.
- Q: A família precisa de uma visão por mês das parcelas que vencem? → A: Sim; consultar
  qualquer mês (atual, próximos e anteriores), com as parcelas do mês e os totais.
- Q: Parcela vencida e não paga deve aparecer como "atrasada"? → A: Não; a parcela só tem as
  situações "paga" e "em aberto".
- Q: Como funciona a amortização (pagar parcelas futuras agora)? → A: Escolher as parcelas
  futuras (por padrão as últimas), informar a data e o valor efetivamente pago (pode ser menor
  pelo desconto de juros); as parcelas ficam quitadas, o desconto aparece na despesa e o
  pagamento entra na visão do mês em que foi feito.
- Q: O sistema já vem com categorias prontas? → A: Não; começa vazio e a família cria as suas.

## Visão geral do modelo

A descrição lista 13 informações por despesa, mas só parte delas é informada pela família; o
restante é **calculado** a partir das informadas, para nunca ficar inconsistente (por exemplo,
"parcelas pagas" + "parcelas faltantes" sempre somam a quantidade de parcelas).

| Informação | Origem |
|---|---|
| Nome, categoria, observação | informada |
| Valor (total ou da parcela, à escolha da família) | informada |
| É parcelada? / quantidade de parcelas | informada (à vista = 1 parcela) |
| Data da primeira parcela | informada |
| Parcelas já pagas (ao cadastrar uma dívida em andamento) | informada |
| Valor da parcela ou valor total (o que não foi informado) | calculada |
| Data da última parcela | calculada |
| Parcelas pagas / parcelas faltantes | calculadas a partir das parcelas marcadas como pagas |
| Valor pago até o momento / quanto falta pagar | calculados (pago = soma do que foi efetivamente pago) |
| Desconto obtido em amortizações | calculado |
| Situação (em aberto / quitada) | calculada |

A despesa é dividida em duas entidades: a **Despesa** (o compromisso: nome, categoria, valor,
observação) e as suas **Parcelas** (uma por mês, cada uma com número, vencimento, valor e se
está paga). Despesa à vista tem uma única parcela. Assim a família marca o pagamento de cada
parcela conforme paga, e os totais se atualizam sozinhos.

Relação com categorias: **cada despesa pertence a exatamente uma categoria; uma categoria pode
ter várias despesas** (um-para-muitos).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gerenciar categorias (Priority: P1)

A família cria as categorias que usa para organizar as dívidas (ex.: "Cartão Nubank",
"Empréstimo", "Carro", "Água", "Luz", "Internet"), consulta a lista, corrige o nome e remove as
que não usa mais.

**Why this priority**: toda despesa precisa de uma categoria, então as categorias vêm antes.

**Independent Test**: criar, listar, renomear e remover categorias sem nenhuma despesa
cadastrada.

**Acceptance Scenarios**:

1. **Given** a pessoa está autenticada, **When** cria uma categoria com um nome, **Then** a
   categoria aparece na lista de categorias.
2. **Given** já existe a categoria "Luz", **When** a pessoa tenta criar " luz " ou "LUZ",
   **Then** a criação é recusada com a mensagem "Já existe uma categoria com esse nome.".
3. **Given** uma categoria existente, **When** a pessoa altera o nome, **Then** a lista e todas
   as despesas daquela categoria passam a mostrar o novo nome.
4. **Given** uma categoria sem despesas, **When** a pessoa a remove, **Then** ela deixa de
   aparecer na lista.
5. **Given** uma categoria com despesas vinculadas, **When** a pessoa tenta removê-la,
   **Then** a remoção é recusada com a mensagem "Não é possível remover uma categoria que possui
   despesas. Mova ou remova as despesas antes.".
6. **Given** a pessoa deixa o nome em branco, **When** envia, **Then** a operação é recusada
   com mensagem em português.

---

### User Story 2 - Registrar uma despesa (Priority: P1)

A família registra uma dívida ou conta: nome, categoria, valor, se é parcelada (e em quantas
vezes), data da primeira parcela, quantas parcelas já foram pagas (para dívidas que já estavam
em andamento) e uma observação opcional. O sistema calcula o restante.

**Why this priority**: é o que substitui a planilha; sem registrar não há o que acompanhar.

**Independent Test**: registrar uma despesa à vista e uma parcelada e verificar os valores
calculados devolvidos.

**Acceptance Scenarios**:

1. **Given** existe a categoria "Água", **When** a pessoa registra "Conta de água de novembro",
   R$ 120,00, à vista, vencendo em 10/12/2026, **Then** a despesa é criada com 1 parcela de
   R$ 120,00, última parcela em 10/12/2026, nada pago e R$ 120,00 faltando.
2. **Given** existe a categoria "Cartão Nubank", **When** a pessoa registra "Geladeira",
   valor de R$ 3.000,00 em 10 parcelas, primeira em 05/01/2027, **Then** a despesa é criada com
   10 parcelas de R$ 300,00 vencendo todo dia 5, a última em 05/10/2027.
3. **Given** a pessoa registra um financiamento de 60 parcelas do qual 24 já foram pagas,
   **When** salva, **Then** as 24 primeiras parcelas ficam marcadas como pagas, faltam 36, e o
   valor pago e o restante refletem isso.
4. **Given** o valor total não divide igualmente pelas parcelas (ex.: R$ 100,00 em 3x),
   **When** a despesa é registrada, **Then** as parcelas somam exatamente o valor total (ex.:
   R$ 33,33 + R$ 33,33 + R$ 33,34).
5. **Given** a pessoa escolhe informar o valor da parcela, **When** registra "Financiamento do
   carro" com parcela de R$ 1.250,00 em 48 vezes, **Then** a despesa é criada com valor total
   de R$ 60.000,00 e 48 parcelas de R$ 1.250,00.
6. **Given** a pessoa informa valor zero ou negativo, quantidade de parcelas menor que 1,
   parcelas já pagas maiores que a quantidade de parcelas, nome em branco, ou uma categoria
   inexistente, **When** envia, **Then** o registro é recusado e todas as mensagens de erro
   aplicáveis são devolvidas juntas, em português.

---

### User Story 3 - Acompanhar e pagar parcelas (Priority: P1)

A família consulta suas despesas e, a cada pagamento, marca a parcela como paga. Vê quanto já
pagou e quanto falta, por despesa e no total.

**Why this priority**: é a pergunta que a planilha responde hoje: "quanto ainda devemos e do
quê?".

**Independent Test**: com despesas cadastradas, listar, marcar parcelas como pagas e conferir
que os totais mudam.

**Acceptance Scenarios**:

1. **Given** existem despesas cadastradas, **When** a pessoa lista as despesas, **Then** vê
   para cada uma: nome, categoria, valor total, valor da parcela, quantidade de parcelas,
   parcelas pagas e faltantes, data da primeira e da última parcela, valor pago, valor
   restante, situação e próximo vencimento em aberto.
2. **Given** a lista de despesas, **When** a pessoa filtra por categoria ou por situação (em
   aberto / quitada), **Then** só vê as despesas correspondentes, e os totais gerais (pago e
   restante) consideram apenas as despesas exibidas.
3. **Given** uma despesa, **When** a pessoa abre o detalhe, **Then** vê todas as parcelas com
   número, vencimento, valor e se está paga.
4. **Given** uma parcela em aberto, **When** a pessoa a marca como paga, **Then** parcelas
   pagas, faltantes, valor pago e restante da despesa são atualizados.
5. **Given** uma parcela marcada como paga por engano, **When** a pessoa desfaz o pagamento,
   **Then** ela volta a ficar em aberto e os totais são atualizados.
6. **Given** a última parcela em aberto é paga, **When** a pessoa consulta a despesa,
   **Then** a situação é "quitada" e não há próximo vencimento.
7. **Given** existem parcelas vencendo em vários meses, **When** a pessoa consulta um mês
   (sem informar mês, o mês atual), **Then** vê todas as parcelas com vencimento naquele mês,
   com despesa, categoria, número da parcela (ex.: 3/10), vencimento, valor e se está paga, além
   do total do mês, do total pago e do total em aberto.
8. **Given** a visão mensal, **When** a pessoa avança para meses futuros ou volta para meses
   anteriores, **Then** vê a previsão do que vai vencer ou o histórico do que venceu, no mesmo
   formato.
9. **Given** um mês sem nenhuma parcela, **When** a pessoa o consulta, **Then** vê a lista
   vazia com totais zerados.

---

### User Story 4 - Amortizar uma dívida (Priority: P2)

A família paga antecipadamente parcelas futuras de uma dívida (ex.: sobrou dinheiro e decidem
quitar as 6 últimas parcelas do financiamento). Informa quais parcelas, a data e quanto
efetivamente pagou, que pode ser menos que a soma das parcelas por causa do desconto de juros.

**Why this priority**: reduz a dívida e os juros; menos frequente que pagar a parcela do mês.

**Independent Test**: amortizar parcelas de uma despesa parcelada e conferir parcelas
quitadas, valor pago, desconto, restante e a visão do mês do pagamento.

**Acceptance Scenarios**:

1. **Given** um financiamento com 48 parcelas de R$ 1.250,00 e 10 pagas, **When** a pessoa
   amortiza as 6 últimas parcelas informando que pagou R$ 6.000,00 hoje, **Then** as parcelas
   43 a 48 ficam pagas, faltam 32, o valor pago aumenta R$ 6.000,00, o desconto obtido é
   R$ 1.500,00 e a data da última parcela em aberto passa a ser a da parcela 42.
2. **Given** a pessoa vai amortizar, **When** não escolhe parcelas, informando só a
   quantidade, **Then** o sistema seleciona as últimas parcelas em aberto.
3. **Given** a pessoa escolhe as parcelas, **When** escolhe as próximas em vez das últimas,
   **Then** o sistema aceita qualquer conjunto de parcelas em aberto.
4. **Given** uma amortização feita em novembro de parcelas que venceriam em 2030, **When** a
   pessoa consulta novembro na visão mensal, **Then** vê o pagamento antecipado com o valor
   efetivamente pago, e essas parcelas não aparecem mais como a pagar nos meses de 2030.
5. **Given** a pessoa informa valor pago maior que a soma das parcelas escolhidas, zero, ou
   escolhe uma parcela já paga ou de outra despesa, **When** envia, **Then** a amortização é
   recusada com mensagem em português.
6. **Given** uma amortização registrada por engano, **When** a pessoa desfaz o pagamento das
   parcelas, **Then** elas voltam a ficar em aberto e o desconto correspondente desaparece.

---

### User Story 5 - Corrigir ou remover uma despesa (Priority: P2)

A família corrige dados de uma despesa registrada errado ou remove uma que não deveria existir.

**Why this priority**: necessário para manter os dados confiáveis, mas usado com menos
frequência que registrar e pagar.

**Independent Test**: editar nome, categoria, valor e parcelas de uma despesa e depois
removê-la.

**Acceptance Scenarios**:

1. **Given** uma despesa existente, **When** a pessoa altera nome, categoria ou observação,
   **Then** as parcelas e seus pagamentos permanecem como estavam.
2. **Given** uma despesa com 3 parcelas pagas, **When** a pessoa altera o valor, a quantidade
   de parcelas ou a data da primeira parcela, **Then** as parcelas são recalculadas e as 3
   primeiras continuam marcadas como pagas.
3. **Given** uma despesa com 3 parcelas pagas, **When** a pessoa tenta reduzir a quantidade de
   parcelas para 2, **Then** a alteração é recusada com mensagem em português informando que
   já existem mais parcelas pagas que o novo total.
4. **Given** uma despesa existente, **When** a pessoa a remove, **Then** a despesa e todas as
   suas parcelas deixam de existir e não entram mais nos totais.
5. **Given** um identificador de despesa ou categoria que não existe, **When** a pessoa tenta
   consultar, editar ou remover, **Then** recebe a mensagem "Despesa não encontrada." ou
   "Categoria não encontrada.".

---

### Edge Cases

- Primeira parcela no dia 29, 30 ou 31: nos meses sem esse dia, o vencimento é o último dia do
  mês (ex.: 31/01 → 28/02 → 31/03).
- Valores com mais de 2 casas decimais são recusados (centavos são a menor unidade).
- Divisão com sobra de centavos: a diferença vai para a última parcela, de modo que a soma das
  parcelas é sempre igual ao valor total.
- Despesa à vista: "é parcelada" = não, 1 parcela, primeira e última parcela na mesma data.
- Marcar como paga uma parcela já paga (ou desfazer em uma não paga) não altera nada nem gera
  erro.
- Parcelas podem ser pagas fora de ordem (ex.: adiantar a última).
- Ao recalcular parcelas numa edição, permanecem pagas as N primeiras, onde N é a quantidade de
  parcelas pagas antes da edição.
- Nome de categoria com espaços nas pontas é salvo sem eles; a comparação de nomes repetidos
  ignora maiúsculas/minúsculas e espaços nas pontas.
- Renomear uma categoria para o nome de outra existente é recusado como nome repetido.
- Despesa com data da primeira parcela no passado é aceita (dívidas já em andamento).
- Amortização que quita todas as parcelas em aberto deixa a despesa "quitada".
- Data de pagamento de uma amortização não pode ser futura.
- Toda operação exige estar autenticado; sem credencial válida o acesso é negado como na
  feature de login.

## Requirements *(mandatory)*

### Functional Requirements

**Categorias**

- **FR-001**: O sistema MUST permitir criar, listar, renomear e remover categorias.
- **FR-002**: O nome da categoria MUST ser obrigatório, ter até 50 caracteres e ser único,
  sem diferenciar maiúsculas/minúsculas e ignorando espaços nas pontas.
- **FR-003**: O sistema MUST recusar a remoção de categoria que tenha despesas vinculadas.
- **FR-004**: A lista de categorias MUST vir em ordem alfabética e informar quantas despesas
  cada uma possui.

**Despesas**

- **FR-005**: O sistema MUST permitir registrar uma despesa com nome (obrigatório, até 100
  caracteres), categoria (obrigatória e existente), valor (maior que zero, até 2 casas
  decimais), indicação de parcelamento, quantidade de parcelas (1 quando não parcelada; até
  480 quando parcelada, mínimo 2), data da primeira parcela, quantidade de parcelas já pagas
  (padrão 0, no máximo a quantidade de parcelas) e observação opcional (até 500 caracteres).
- **FR-006**: No registro e na edição, a família MUST escolher se informa o **valor total** ou
  o **valor da parcela**; o outro valor MUST ser calculado pelo sistema (valor da parcela =
  total ÷ quantidade, com sobra de centavos na última; valor total = parcela × quantidade).
  O sistema MUST guardar qual dos dois foi informado, para que a edição mostre o mesmo modo.
- **FR-007**: O sistema MUST gerar uma parcela por mês a partir da data da primeira parcela,
  no mesmo dia do mês (ou no último dia, quando o mês não tem esse dia).
- **FR-008**: A soma dos valores das parcelas MUST ser exatamente igual ao valor total da
  despesa; sobras de centavos vão para a última parcela.
- **FR-009**: O sistema MUST calcular e devolver, para cada despesa: valor total, valor da
  parcela, data da última parcela, parcelas pagas, parcelas faltantes, valor pago (soma do que
  foi efetivamente pago), desconto obtido, valor restante (soma das parcelas em aberto),
  situação (em aberto / quitada) e próximo vencimento em aberto.
- **FR-010**: O sistema MUST permitir marcar e desmarcar cada parcela como paga,
  individualmente e em qualquer ordem. Ao marcar, a data de pagamento é a data atual (ou outra
  informada) e o valor pago é o valor da parcela.
- **FR-011**: O sistema MUST listar as despesas com filtro opcional por categoria e por
  situação, devolvendo também o total pago e o total restante das despesas listadas, ordenadas
  pelo próximo vencimento em aberto (quitadas por último).
- **FR-012**: O sistema MUST permitir consultar uma despesa com todas as suas parcelas.
- **FR-013**: O sistema MUST permitir editar todos os dados informados de uma despesa; ao
  mudar valor, quantidade de parcelas ou data da primeira parcela, as parcelas MUST ser
  recalculadas mantendo pagas as N primeiras (N = parcelas pagas antes da edição), e a edição
  MUST ser recusada se a nova quantidade for menor que N ou se a despesa tiver parcelas
  amortizadas (é preciso desfazer a amortização antes).
- **FR-014**: O sistema MUST permitir remover uma despesa, removendo junto todas as suas
  parcelas.
- **FR-018**: O sistema MUST oferecer uma visão mensal: dado um mês e ano quaisquer (passado,
  atual ou futuro; padrão o mês atual), listar todas as parcelas com vencimento naquele mês,
  ordenadas por vencimento, com despesa, categoria, número/total de parcelas, valor e se está
  paga, e os totais do mês (total, pago, em aberto). MUST permitir filtrar por categoria e
  marcar/desmarcar parcelas como pagas a partir dessa visão. Parcelas pagas antes do mês de
  vencimento (amortização ou adiantamento) MUST aparecer no mês em que foram pagas, com o valor
  efetivamente pago e indicação de pagamento antecipado, e não no mês de vencimento.
- **FR-019**: O sistema MUST permitir amortizar uma despesa: escolher uma ou mais parcelas em
  aberto (ou informar uma quantidade, e o sistema escolhe as últimas), a data do pagamento e o
  valor efetivamente pago (maior que zero e no máximo a soma das parcelas escolhidas). As
  parcelas ficam pagas; o valor pago é distribuído entre elas proporcionalmente ao valor de
  cada uma, sem perda de centavos, e a diferença é registrada como desconto.

**Gerais**

- **FR-015**: Todas as funcionalidades desta feature MUST exigir credencial de acesso válida.
- **FR-016**: Todas as mensagens ao usuário MUST estar em português, e erros de validação MUST
  ser devolvidos todos de uma vez.
- **FR-017**: Valores monetários MUST ser tratados em reais com precisão exata de centavos,
  sem erros de arredondamento.

### Key Entities

- **Categoria**: agrupamento das despesas definido pela família. Atributos: nome (único),
  data de criação. Uma categoria tem zero ou mais despesas.
- **Despesa**: um compromisso financeiro (conta, compra, dívida). Atributos informados: nome,
  categoria, valor (total ou da parcela, com a indicação de qual foi informado), quantidade
  de parcelas, data da primeira parcela, observação.
  Pertence a exatamente uma categoria e possui uma ou mais parcelas. Os valores calculados
  (pago, restante, situação etc.) não são digitados.
- **Parcela**: cada pagamento mensal de uma despesa. Atributos: número (1..N), data de
  vencimento, valor, se está paga, data do pagamento, valor efetivamente pago e se foi paga por
  amortização. Pertence a exatamente uma
  despesa e deixa de existir junto com ela.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A família consegue registrar uma despesa parcelada em menos de 1 minuto,
  informando no máximo 7 campos.
- **SC-002**: Em 100% das despesas, parcelas pagas + parcelas faltantes = quantidade de
  parcelas e valor pago + desconto obtido + valor restante = valor total, inclusive após
  edições e amortizações.
- **SC-003**: Em 100% das despesas, a soma das parcelas é igual ao valor total, sem diferença
  de nenhum centavo.
- **SC-004**: A família responde "quanto ainda devemos no total e em cada categoria?" com uma
  única consulta, sem fazer contas à mão.
- **SC-008**: A família responde "quanto vamos pagar (ou pagamos) no mês X?" para qualquer mês
  com uma única consulta, e o total bate com a soma das parcelas daquele mês.
- **SC-005**: Todas as informações que a planilha atual tem por dívida (as 13 listadas na
  descrição) estão disponíveis na consulta de despesas.
- **SC-006**: 100% das tentativas de remover uma categoria com despesas são recusadas; nenhuma
  despesa fica sem categoria.
- **SC-007**: 100% das mensagens exibidas ao usuário nesta funcionalidade estão em português.

## Assumptions

- Depende da feature 001 (conta única e autenticação): como existe uma só conta, todas as
  categorias e despesas pertencem a ela.
- O sistema começa sem nenhuma categoria; a família cria as suas antes de registrar a
  primeira despesa.
- As categorias servem para qualquer tipo de compromisso que a família queira acompanhar como
  "despesa" (cartão, empréstimo, carro, contas de consumo, dinheiro reservado para guardar).
  Receitas (ex.: venda de algo) e metas de economia como conceitos próprios ficam para uma
  feature futura.
- Parcelas são sempre mensais.
- Não existe situação "atrasada": parcela vencida e não paga continua "em aberto".
- Contas de consumo que variam todo mês (água, luz, internet) são registradas como uma
  despesa à vista por mês; lançamento recorrente automático fica para uma feature futura.
- Não há juros, multa ou desconto calculados pelo sistema; o valor informado já é o que será
  pago.
- Pagar uma parcela do mês é marcar como paga pelo valor cheio; valor pago menor que o da
  parcela só existe via amortização. Não há pagamento parcial de uma parcela nem registro da
  conta bancária de origem nesta versão.
- Remover despesa é definitivo (sem lixeira); a confirmação antes de remover fica a cargo da
  interface.
- Fora de escopo: receitas, contas bancárias/cartões como entidade própria (com limite e
  fatura), lançamentos recorrentes, relatórios com gráficos, anexos de comprovantes,
  frontend. (A visão mensal de parcelas está no escopo; relatórios com gráficos não.)
