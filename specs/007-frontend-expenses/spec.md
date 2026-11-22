# Feature Specification: Tela de Despesas

**Feature Branch**: `007-frontend-expenses`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Tela de Despesas do frontend (rota /despesas). Lista do mês com o
seletor de mês (anterior, atual e próximos), mostrando as parcelas que vencem no mês, o total e o que
está pago e pendente. Cadastrar despesa: nome, categoria, valor total ou por parcela, parcelado ou à
vista, quantidade de parcelas, primeiro vencimento, parcelas já pagas, observação e divisão com uma
pessoa (percentual). Editar, remover com confirmação, marcar parcela como paga ou desfazer, e
amortizar (adiantar parcelas futuras). Filtro por categoria."

## Clarifications

### Session 2026-11-21

- Q: A divisão da despesa com uma pessoa entra nesta feature ou fica para a tela de Pessoas? → A:
  Entra na 007; o formulário escolhe entre pessoas já existentes (integral ou percentual) e, sem
  pessoas, explica onde cadastrá-las.
- Q: Além da visão do mês, a tela também tem a visão "Todas"? → A: Sim; duas abas, "Mês" (padrão)
  e "Todas" (filtros por categoria e situação, totais pago e restante). A aba escolhida também fica
  no endereço. Tocar numa parcela do mês abre o detalhe da despesa.
- Q: Com primeiro vencimento no passado, "parcelas já pagas" vem preenchido sozinho? → A: Sim, no
  cadastro sugere as parcelas vencidas antes do mês atual (editável), e o resumo mostra "N pagas ·
  faltam M"; a sugestão para de acompanhar a data depois que a família edita o campo.
- Q: Qual primeiro vencimento vem preenchido em "Nova despesa"? → A: O dia de hoje no mês aberto na
  visão do mês (último dia do mês quando o dia não existe); na aba "Todas", hoje.

## Visão geral

A área **Despesas** (hoje "em construção") passa a ser a tela onde a família registra e acompanha
o que gasta, substituindo as colunas de contas e parcelas da planilha. Ela tem duas visões:

- **Mês** (padrão): as parcelas que vencem no mês escolhido — as do mês atual, de meses
  anteriores (para conferir) e dos próximos (para planejar) —, com total, pago e em aberto, e a
  marcação de cada parcela como paga direto na lista.
- **Todas**: as despesas cadastradas, com situação (em aberto / quitada), parcelas pagas e
  faltantes, valor pago, desconto e restante; é por ela que se abre o detalhe para editar,
  remover ou amortizar.

```text
Despesas                                   [+ Nova despesa]
[ Mês | Todas ]
◀  novembro de 2026  ▶          Categoria: [Todas ▾]
┌──────────────────────────────────────────────────────┐
│ Total R$ 4.350,00 · Pago R$ 1.200,00 · Em aberto R$ 3.150,00 │
├──────────────────────────────────────────────────────┤
│ ☑ 05/11  Aluguel · Moradia ............ R$ 1.200,00 │
│ ☐ 10/11  Geladeira · Casa · 3/10 ......... R$ 350,00 │
│ ☐ 15/11  Carro · Transporte · 43/48 ... R$ 1.000,00 │
│ ☑ 20/11  Notebook · antecipada ........... R$ 900,00 │
└──────────────────────────────────────────────────────┘
```

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver as despesas do mês (Priority: P1)

A família abre Despesas e vê as parcelas que vencem no mês atual, com os totais do mês. Troca o mês
para conferir o anterior ou planejar os próximos, e filtra por categoria.

**Why this priority**: é a pergunta que a planilha responde todo mês ("quanto temos para pagar e o
que já foi pago"); sem ela, as demais ações não têm onde aparecer.

**Independent Test**: com despesas já registradas pela API, abrir a tela, navegar entre meses e
filtrar por categoria, conferindo parcelas e totais.

**Acceptance Scenarios**:

1. **Given** despesas com parcelas em novembro de 2026, **When** a família abre Despesas em
   novembro, **Then** vê as parcelas do mês em ordem de vencimento, cada uma com data, nome da
   despesa, categoria, número/total de parcelas (quando parcelada), valor e se está paga, e os
   totais do mês: total, pago e em aberto.
2. **Given** a tela no mês atual, **When** a família avança ou volta o mês, **Then** vê as parcelas
   e totais daquele mês, e o mês escolhido aparece por extenso (ex.: "dezembro de 2026").
3. **Given** a família escolhe uma categoria no filtro, **When** a lista atualiza, **Then** mostra só
   as parcelas daquela categoria, com os totais recalculados para o filtro.
4. **Given** uma parcela paga antes do mês de vencimento (amortização ou adiantamento), **When** a
   família vê o mês em que ela foi paga, **Then** a parcela aparece ali, com o valor efetivamente
   pago e a indicação "antecipada"; no mês de vencimento ela não aparece.
5. **Given** um mês sem parcelas, **When** a família o abre, **Then** vê um estado vazio com a ação
   "Nova despesa".
6. **Given** a família sai da tela e volta, **When** reabre Despesas, **Then** o mês e o filtro
   escolhidos continuam no endereço (dá para recarregar ou compartilhar o link no mesmo mês).

---

### User Story 2 - Marcar parcela como paga ou desfazer (Priority: P1)

Ao pagar uma conta, a família marca a parcela como paga direto na lista do mês; se marcou por
engano, desmarca.

**Why this priority**: é a ação mais frequente do dia a dia e o que mantém o "em aberto" do mês
correto.

**Independent Test**: marcar e desmarcar parcelas na visão do mês e conferir a situação e os totais.

**Acceptance Scenarios**:

1. **Given** uma parcela em aberto, **When** a família a marca como paga, **Then** ela aparece como
   paga (com a data de hoje), o pago do mês aumenta e o em aberto diminui no mesmo valor, e um aviso
   confirma "Parcela marcada como paga.".
2. **Given** uma parcela paga, **When** a família desfaz o pagamento, **Then** ela volta a ficar em
   aberto e os totais voltam ao que eram.
3. **Given** a família quer registrar que pagou em outro dia, **When** escolhe "Pagar em outra
   data", **Then** informa a data (não futura) e a parcela fica paga naquela data.
4. **Given** uma parcela amortizada (paga com desconto), **When** a família tenta desfazer, **Then**
   o sistema pede confirmação explicando que o desconto daquela amortização deixa de valer.
5. **Given** a API recusa a operação, **When** a resposta chega, **Then** a parcela volta ao estado
   anterior e a mensagem da API é exibida como veio.

---

### User Story 3 - Cadastrar uma despesa (Priority: P1)

A família registra uma conta ou compra: à vista ou parcelada, informando o valor total ou o valor da
parcela, o primeiro vencimento e quantas parcelas já foram pagas (para compras antigas).

**Why this priority**: sem cadastro não há o que acompanhar; é o que tira os dados da planilha.

**Independent Test**: cadastrar despesas à vista e parceladas nos dois modos de valor e conferir na
visão do mês e na lista de todas.

**Acceptance Scenarios**:

1. **Given** o formulário "Nova despesa", **When** a família informa nome "Geladeira", categoria
   "Casa", parcelado em 10×, valor total R$ 3.500,00 e primeiro vencimento 10/11/2026, **Then** o
   formulário mostra, antes de salvar, "10 × R$ 350,00 · última em 10/08/2027", e ao salvar a
   despesa aparece em novembro como parcela 1/10 e um aviso confirma "Despesa cadastrada.".
2. **Given** o modo "valor da parcela", **When** a família informa 48 parcelas de R$ 1.000,00,
   **Then** o formulário mostra o total R$ 48.000,00.
3. **Given** um total que não divide exato (R$ 100,00 em 3×), **When** a família vê o resumo,
   **Then** ele indica que a última parcela leva a sobra de centavos (R$ 33,33 + R$ 33,33 +
   R$ 33,34).
4. **Given** uma compra antiga em 48× com primeiro vencimento em 15/05/2023 e hoje em novembro de
   2026, **When** a família informa a data, **Then** "parcelas já pagas" vem sugerido com 42 (as
   vencidas antes de novembro), o resumo mostra "42 pagas · faltam 6", a família pode alterar o
   número, e ao salvar as 42 primeiras ficam pagas.
5. **Given** "à vista", **When** a família salva, **Then** há uma única parcela no mês do vencimento
   informado.
6. **Given** campos inválidos (sem nome, sem categoria, valor zero, parcelas fora do limite, já
   pagas maior que o total), **When** a família tenta salvar, **Then** cada campo mostra sua mensagem
   e nada é enviado; recusas da API aparecem no formulário como vieram.
7. **Given** a família está vendo dezembro de 2026 e hoje é 21/11/2026, **When** abre "Nova
   despesa", **Then** o primeiro vencimento vem como 21/12/2026.
8. **Given** não há categorias de despesa, **When** a família abre "Nova despesa", **Then** vê o
   aviso de que é preciso criar uma categoria, com atalho para Configurações.

---

### User Story 4 - Ver, editar e remover uma despesa (Priority: P2)

Na visão "Todas" (ou tocando numa parcela do mês), a família abre o detalhe de uma despesa com todas
as parcelas, corrige dados ou remove a despesa.

**Why this priority**: corrigir erros de digitação e apagar lançamentos indevidos é necessário, mas
menos frequente que cadastrar e pagar.

**Independent Test**: abrir o detalhe, editar valor e quantidade de parcelas, remover, e conferir
lista e visão do mês.

**Acceptance Scenarios**:

1. **Given** a visão "Todas", **When** a família a abre, **Then** vê as despesas ordenadas pelo
   próximo vencimento em aberto (quitadas por último), cada uma com nome, categoria, situação,
   parcelas pagas/total, valor pago, restante e próximo vencimento, e os totais pago e restante;
   pode filtrar por categoria e por situação (em aberto / quitadas).
2. **Given** a família abre uma despesa, **When** o detalhe aparece, **Then** mostra os dados, o
   valor pago, o desconto obtido, o restante e a lista de parcelas com vencimento, valor, situação,
   data e valor pagos e a marca de amortizada.
3. **Given** o detalhe, **When** a família edita e salva, **Then** o formulário vem preenchido com
   os dados e o mesmo modo de valor (total ou parcela) usado no cadastro, as parcelas são
   recalculadas pela API mantendo as já pagas, e um aviso confirma "Despesa atualizada.".
4. **Given** a despesa tem parcelas amortizadas ou a nova quantidade é menor que as já pagas,
   **When** a família tenta salvar, **Then** a mensagem da API explica a recusa.
5. **Given** o detalhe, **When** a família escolhe remover e confirma, **Then** a despesa e suas
   parcelas somem da lista e do mês, e um aviso confirma "Despesa removida.".

---

### User Story 5 - Amortizar parcelas futuras (Priority: P2)

A família adianta parcelas de uma dívida (ex.: quitar as 6 últimas do carro com desconto de juros),
informando quais parcelas ou quantas, a data e o valor efetivamente pago.

**Why this priority**: pedido explícito da família e já suportado pela API, mas usado
eventualmente.

**Independent Test**: amortizar parcelas de uma despesa parcelada e conferir parcelas quitadas,
desconto e a visão do mês do pagamento.

**Acceptance Scenarios**:

1. **Given** uma despesa com 32 parcelas em aberto de R$ 1.000,00, **When** a família escolhe
   "Amortizar", informa "as 6 últimas", hoje e R$ 5.400,00 pagos, **Then** o formulário mostra,
   antes de confirmar, "6 parcelas · R$ 6.000,00 · desconto de R$ 600,00", e ao confirmar as
   parcelas ficam pagas com a marca "amortizada", o desconto da despesa aumenta R$ 600,00 e um aviso
   confirma "Amortização registrada.".
2. **Given** a família prefere escolher as parcelas, **When** marca parcelas específicas na lista,
   **Then** a amortização usa as escolhidas.
3. **Given** o valor pago maior que a soma das parcelas, data futura ou nenhuma parcela, **When** a
   família tenta confirmar, **Then** o formulário mostra a mensagem e nada é enviado.
4. **Given** a amortização feita em novembro, **When** a família vê novembro, **Then** as parcelas
   aparecem como "antecipadas" com o valor efetivamente pago.

---

### User Story 6 - Dividir a despesa com uma pessoa (Priority: P3)

Ao cadastrar ou editar, a família indica que a despesa (ou parte dela) é de outra pessoa — ex.: o
sogro que usou o cartão, ou metade da fatura que é da esposa —, para que cada parcela gere uma
cobrança para ela.

**Why this priority**: completa o fluxo de reembolsos da planilha, mas depende de pessoas
cadastradas (a tela de Pessoas vem numa feature seguinte).

**Independent Test**: com uma pessoa cadastrada pela API, marcar uma despesa como dela com 50% e
conferir a indicação na lista e no detalhe.

**Acceptance Scenarios**:

1. **Given** existe a pessoa "Sogro", **When** a família escolhe "Dividir com uma pessoa", seleciona
   "Sogro" e "Integral", **Then** a despesa fica marcada como dele (100%) e a lista e o detalhe
   mostram "Sogro · 100%".
2. **Given** a família escolhe "Percentual", **When** informa 50, **Then** a despesa fica marcada
   com 50% e o formulário mostra a parte da pessoa por parcela (ex.: "R$ 175,00 por parcela").
3. **Given** percentual fora de 1 a 100, **When** a família tenta salvar, **Then** o campo mostra a
   mensagem.
4. **Given** não há pessoas cadastradas, **When** a família abre o formulário, **Then** a opção
   explica que as pessoas são cadastradas na área Pessoas e não pode ser usada.
5. **Given** uma despesa marcada, **When** a família remove a pessoa na edição, **Then** a despesa
   deixa de gerar cobranças.

---

### Edge Cases

- Mês fora do limite (antes de 2000 ou depois de 2100): o seletor não avança além do limite; um
  endereço com mês inválido abre o mês atual.
- Endereço com categoria que não existe: o filtro volta para "Todas".
- Parcela marcada como paga em dois toques rápidos: a segunda ação espera a primeira terminar (sem
  enviar duas vezes).
- Valor da parcela calculado no formulário diferente do da API (centavos): vale o da API depois de
  salvar; o resumo do formulário usa a mesma regra (sobra na última).
- Dia de vencimento inexistente no mês (31 em fevereiro): o resumo e a lista mostram a data que a
  API devolveu (último dia do mês).
- Despesa removida enquanto o detalhe está aberto em outro aparelho: a ação seguinte mostra a
  mensagem da API (404) e o detalhe fecha, voltando à lista atualizada.
- Sessão expirada no meio do formulário: segue a regra da 005 (volta à entrada com aviso).
- Muitas parcelas (até 480) no detalhe: a lista continua utilizável no celular (rolagem dentro do
  painel, sem travar).
- Sem conexão: mensagem amigável e "Tentar novamente" nas listas; formulários mantêm o que foi
  digitado.

## Requirements *(mandatory)*

### Functional Requirements

**Visão do mês**

- **FR-001**: A tela MUST mostrar, para o mês escolhido (padrão: mês atual), as parcelas com
  vencimento no mês em ordem de vencimento — com data, nome da despesa, categoria, número/total
  (quando parcelada), valor e situação — e os totais do mês (total, pago, em aberto).
- **FR-002**: A tela MUST permitir trocar o mês (anterior/próximo e escolha direta), limitado de
  janeiro de 2000 a dezembro de 2100, e filtrar por categoria; a aba (Mês/Todas), o mês e os
  filtros MUST ficar no endereço. Tocar numa parcela do mês MUST abrir o detalhe da despesa.
- **FR-003**: Parcelas pagas antes do mês de vencimento MUST aparecer no mês do pagamento, com o
  valor efetivamente pago e a indicação "antecipada".
- **FR-004**: A família MUST poder marcar e desmarcar cada parcela como paga direto na visão do mês,
  com data de hoje por padrão ou outra data não futura; a lista e os totais MUST refletir a mudança
  sem recarregar a página.

**Todas as despesas e detalhe**

- **FR-005**: A visão "Todas" MUST listar as despesas com situação, parcelas pagas/total, valor pago,
  restante e próximo vencimento, ordenadas pelo próximo vencimento em aberto (quitadas por último),
  com os totais pago e restante e filtros por categoria e situação.
- **FR-006**: O detalhe da despesa MUST mostrar todos os dados, valor pago, desconto, restante e a
  lista completa de parcelas (vencimento, valor, situação, data e valor pagos, marca de
  amortizada), permitindo marcar/desmarcar parcelas também ali.

**Cadastro e edição**

- **FR-007**: O formulário MUST ter nome (obrigatório, até 100 caracteres), categoria de despesa
  (obrigatória), modo de valor (total ou parcela), valor (maior que zero, em reais), à vista ou
  parcelado, quantidade de parcelas (2 a 480 quando parcelado), primeiro vencimento (obrigatório;
  no cadastro, padrão o dia de hoje no mês aberto na visão do mês — último dia do mês quando o dia
  não existe — ou hoje na aba "Todas"), parcelas já pagas (0 até a quantidade) e observação (até 500
  caracteres).
- **FR-008**: Antes de salvar, o formulário MUST mostrar o resumo calculado: quantidade × valor da
  parcela (ou total), data da última parcela, parcelas pagas e faltantes e, quando houver, a sobra
  de centavos na última.
- **FR-018**: No cadastro, quando o primeiro vencimento estiver no passado, "parcelas já pagas" MUST
  ser sugerido como a quantidade de parcelas com vencimento antes do mês atual (limitado à
  quantidade de parcelas); a sugestão acompanha mudanças de data e quantidade até a família editar
  o campo, e não se aplica à edição.
- **FR-009**: A edição MUST abrir com os dados atuais e o mesmo modo de valor do cadastro; recusas
  da API (ex.: parcelas amortizadas, quantidade menor que as pagas) MUST aparecer no formulário.
- **FR-010**: Remover MUST exigir confirmação explícita informando que as parcelas serão removidas
  junto.

**Amortização**

- **FR-011**: A família MUST poder amortizar uma despesa escolhendo parcelas em aberto específicas
  ou uma quantidade (as últimas em aberto), a data do pagamento (não futura; padrão hoje) e o valor
  pago (maior que zero e no máximo a soma das parcelas escolhidas); o formulário MUST mostrar a
  soma das parcelas e o desconto antes de confirmar.
- **FR-012**: Desfazer o pagamento de uma parcela amortizada MUST pedir confirmação.

**Divisão com pessoa**

- **FR-013**: O formulário MUST permitir indicar uma pessoa já cadastrada e a parte dela (integral
  ou percentual de 1 a 100), mostrar a parte da pessoa por parcela, e permitir remover a indicação;
  sem pessoas cadastradas, a opção MUST explicar onde cadastrá-las.

**Gerais**

- **FR-014**: Formulários MUST abrir no painel responsivo da 006 (diálogo no computador, de baixo no
  celular); operações concluídas MUST mostrar aviso breve; mensagens da API MUST aparecer como
  vieram.
- **FR-015**: Listas MUST mostrar indicador de carregamento, estado vazio com ação e, em falha,
  mensagem com "Tentar novamente".
- **FR-016**: Após cadastrar, editar, remover, pagar, desfazer ou amortizar, a visão do mês, a lista
  de todas, o detalhe e as contagens de categorias MUST refletir a mudança.
- **FR-017**: Todos os textos MUST estar em português, valores em reais e datas no formato
  dd/mm/aaaa; a tela MUST funcionar de 360 px a 1920 px sem rolagem horizontal.

### Key Entities

- **Parcela do mês**: item da visão mensal — despesa (id e nome), categoria, número/total, vencimento,
  valor, situação, data e valor pagos, amortizada, antecipada.
- **Despesa (resumo)**: item da visão "Todas" — nome, categoria, modo de valor, total, valor da
  parcela, parcelada, quantidade, pagas/faltantes, primeiro/último/próximo vencimento, pago,
  desconto, restante, situação, observação, pessoa e percentual.
- **Despesa (detalhe)**: o resumo mais a lista de parcelas.
- **Totais**: do mês (total, pago, em aberto) e da lista (pago, restante, desconto).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cadastrar uma despesa parcelada leva menos de 45 segundos a partir da tela de
  Despesas.
- **SC-002**: Marcar uma parcela como paga leva um toque (mais a confirmação apenas para parcelas
  amortizadas) e os totais do mês se atualizam em menos de 1 segundo após a resposta.
- **SC-003**: Os totais do mês exibidos são sempre iguais aos devolvidos pela API para o mesmo mês e
  filtro (nenhum cálculo financeiro próprio da tela diverge do servidor).
- **SC-004**: 100% das recusas da API aparecem na tela junto da ação que as causou.
- **SC-005**: A família consegue ver qualquer mês entre o atual e 12 meses à frente em no máximo 12
  toques no seletor (ou 2 pela escolha direta).
- **SC-006**: A tela funciona sem rolagem horizontal de 360 px a 1920 px.

## Assumptions

- Todo o comportamento já existe na API (features 002 e 004): visão mensal, lista, detalhe,
  cadastro, edição, remoção, pagar/desfazer parcela, amortização e marcação de pessoa. Esta feature
  não muda o backend.
- Os valores calculados exibidos antes de salvar (valor da parcela, total, última data, desconto) são
  só uma prévia com a mesma regra da API; depois de salvar, valem os valores devolvidos pela API.
- Pessoas são cadastradas na tela de Pessoas (feature futura) ou já existem pela API; aqui só são
  escolhidas.
- Usa os componentes da 005 e 006: `MonthPicker`, `MoneyInput`, `ConfirmDialog`, painel
  responsivo, `EmptyState`, `ApiErrorAlert`, carregamento sob demanda.
- Fora de escopo: contas fixas/recorrências (feature 008), receitas, cobranças e pagamentos de
  pessoas, resumo do mês, importação da planilha, anexos de comprovantes.
