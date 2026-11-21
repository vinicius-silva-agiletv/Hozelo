# Feature Specification: Tela de Configurações (Categorias, Saldo Inicial e Conta)

**Feature Branch**: `006-frontend-settings`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Tela de Configurações do frontend (rota /configuracoes). Seção
Categorias: listar as categorias separadas por tipo (despesa e receita), com a quantidade de
lançamentos de cada uma; criar categoria escolhendo o tipo; renomear (o tipo não muda); remover com
confirmação, sendo recusado com a mensagem da API quando houver lançamentos; nome repetido no mesmo
tipo mostra a mensagem da API; estado vazio quando não houver categorias de um tipo, com ação para
criar. Seção Saldo inicial: mostrar o saldo inicial atual (valor e data de referência) ou aviso de
que ainda não foi informado; informar ou alterar com campo de valor em reais (aceita negativo) e data
de referência, explicando que ele é o ponto de partida do saldo acumulado no resumo do mês. Seção
Conta: mostrar nome e e-mail da conta (somente leitura) e o botão de sair. Formulários em
painel/diálogo responsivo (no celular abrindo de baixo), avisos de sucesso, mensagens de erro da API
exibidas como vieram. Também carregar as telas do app sob demanda (divisão de código por rota) para
reduzir o pacote inicial. Fora de escopo: editar nome/e-mail/senha da conta, tema, telas de
despesas/receitas."

## Clarifications

### Session 2026-11-21

- Q: No primeiro uso, há atalho para criar categorias sugeridas? → A: Sim; no estado vazio de cada
  tipo, "Usar sugestões" abre uma lista marcável de categorias comuns daquele tipo e cria só as
  marcadas.
- Q: Qual data de referência vem preenchida ao informar o saldo inicial pela primeira vez? → A: Dia 1º
  do mês atual, com a dica "Use o saldo que vocês tinham no início do mês".

## Visão geral

A área **Configurações** (hoje "em construção") passa a ser a primeira tela real do app. É onde a
família prepara o que as outras telas precisam: as **categorias** (toda despesa e receita exige uma)
e o **saldo inicial** (ponto de partida do saldo acumulado do resumo do mês). Também mostra os dados
da **conta**.

```text
Configurações
┌───────────────────────────────────────────────┐
│ Categorias                    [+ Nova categoria]│
│ [ Despesas | Receitas ]                        │
│  Carro ........................ 3 lançamentos ⋯│
│  Luz .......................... 1 lançamento  ⋯│
├───────────────────────────────────────────────┤
│ Saldo inicial                       [Alterar]  │
│  R$ 3.200,00 em 01/11/2026                     │
│  Ponto de partida do saldo acumulado.          │
├───────────────────────────────────────────────┤
│ Conta                                          │
│  Família Silva · familia@exemplo.com   [Sair]  │
└───────────────────────────────────────────────┘
```

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver e criar categorias (Priority: P1)

A família vê suas categorias de despesa e de receita, com quantos lançamentos cada uma tem, e cria
novas categorias escolhendo o tipo.

**Why this priority**: sem categorias não é possível registrar despesas nem receitas nas próximas
telas.

**Independent Test**: com e sem categorias cadastradas, alternar entre os tipos e criar categorias
dos dois tipos.

**Acceptance Scenarios**:

1. **Given** existem categorias, **When** a pessoa abre Configurações, **Then** vê as categorias de
   despesa em ordem alfabética, cada uma com a quantidade de lançamentos ("1 lançamento", "3
   lançamentos", "Nenhum lançamento"), e pode alternar para as de receita.
2. **Given** não há categorias de um tipo, **When** a pessoa vê esse tipo, **Then** vê um estado
   vazio explicando para que servem as categorias, com as ações "Nova categoria" e "Usar sugestões".
3. **Given** a pessoa escolhe "Nova categoria", **When** informa o nome, escolhe o tipo (já
   preenchido com o tipo que estava sendo visto) e confirma, **Then** a categoria aparece na lista do
   tipo escolhido e um aviso confirma a criação.
4. **Given** já existe "Luz" como despesa, **When** a pessoa tenta criar "luz" como despesa, **Then**
   vê a mensagem enviada pelo sistema ("Já existe uma categoria com esse nome.") e o formulário
   continua aberto com o que foi digitado.
5. **Given** já existe "Carro" como despesa, **When** a pessoa cria "Carro" como receita, **Then** a
   criação é aceita.
6. **Given** o nome está vazio ou passa de 50 caracteres, **When** a pessoa confirma, **Then** vê o
   problema junto do campo, sem enviar.
7. **Given** não há categorias de despesa, **When** a pessoa escolhe "Usar sugestões", **Then** vê uma
   lista de categorias comuns de despesa (Mercado, Moradia, Água, Luz, Internet, Transporte, Cartão
   de crédito, Saúde, Lazer), todas marcadas, podendo desmarcar; ao confirmar, as marcadas são
   criadas e aparecem na lista, com um aviso "N categorias criadas.".
8. **Given** as sugestões de receita (Salário, 13º salário, Vendas, Outros), **When** a pessoa
   desmarca todas, **Then** o botão de confirmar fica indisponível.
9. **Given** alguma sugestão não pôde ser criada (ex.: nome já existente), **When** as demais são
   criadas, **Then** a pessoa vê quais foram criadas e a mensagem do sistema para as que falharam.

---

### User Story 2 - Renomear e remover categorias (Priority: P1)

A família corrige o nome de uma categoria ou remove uma que não usa.

**Why this priority**: categorias erradas ou sobrando atrapalham o lançamento do dia a dia.

**Independent Test**: renomear e remover categorias com e sem lançamentos.

**Acceptance Scenarios**:

1. **Given** uma categoria, **When** a pessoa escolhe "Renomear", altera o nome e confirma, **Then** a
   lista mostra o novo nome (na ordem alfabética) e um aviso confirma; o tipo não pode ser alterado.
2. **Given** a pessoa renomeia para um nome já usado no mesmo tipo, **When** confirma, **Then** vê a
   mensagem enviada pelo sistema.
3. **Given** uma categoria sem lançamentos, **When** a pessoa escolhe "Remover", **Then** um diálogo
   pede confirmação ("Remover a categoria Luz?"); ao confirmar, a categoria some da lista e um aviso
   confirma.
4. **Given** uma categoria com lançamentos, **When** a pessoa tenta removê-la, **Then** vê a mensagem
   enviada pelo sistema ("Não é possível remover uma categoria que possui lançamentos...") e a
   categoria continua na lista.
5. **Given** a pessoa abre a confirmação de remoção, **When** escolhe "Cancelar", **Then** nada muda.

---

### User Story 3 - Informar o saldo inicial (Priority: P1)

A família informa quanto tinha em uma data, para que o resumo do mês calcule o saldo acumulado a
partir dali, e pode alterar esse valor depois.

**Why this priority**: o saldo acumulado do resumo do mês depende dele; sem ele o resumo mostra o
aviso de que falta o saldo inicial.

**Independent Test**: sem saldo inicial, informar; depois alterar valor e data, incluindo valor
negativo.

**Acceptance Scenarios**:

1. **Given** o saldo inicial ainda não foi informado, **When** a pessoa abre Configurações, **Then**
   vê "Saldo inicial ainda não informado", uma explicação de que ele é o ponto de partida do saldo
   acumulado no resumo do mês, e a ação "Informar saldo inicial".
2. **Given** a pessoa informa R$ 3.200,00 e a data 01/11/2026 e confirma, **When** o sistema aceita,
   **Then** a seção mostra "R$ 3.200,00 em 01/11/2026" e um aviso confirma.
3. **Given** a conta da família estava no vermelho na data, **When** a pessoa marca que o saldo é
   negativo e informa R$ 450,00, **Then** a seção mostra "−R$ 450,00" destacado como negativo.
4. **Given** já existe um saldo inicial, **When** a pessoa escolhe "Alterar", **Then** o formulário
   abre com o valor, o sinal e a data atuais, e a alteração substitui o anterior.
5. **Given** a data está vazia, **When** a pessoa confirma, **Then** vê o problema junto do campo.
6. **Given** o saldo inicial ainda não foi informado, **When** a pessoa abre o formulário, **Then** a
   data vem preenchida com o dia 1º do mês atual e há a dica "Use o saldo que vocês tinham no início
   do mês"; o valor começa em R$ 0,00.

---

### User Story 4 - Ver os dados da conta (Priority: P2)

A família confere em qual conta está conectada e pode sair por aqui também.

**Why this priority**: informativo; o nome e o Sair já estão no menu.

**Independent Test**: abrir a seção e sair.

**Acceptance Scenarios**:

1. **Given** a pessoa está conectada, **When** abre Configurações, **Then** vê o nome e o e-mail da
   conta, sem opção de editar.
2. **Given** a seção Conta, **When** a pessoa escolhe "Sair", **Then** volta para a tela de entrada.

---

### User Story 5 - Telas carregadas sob demanda (Priority: P2)

O app abre mais rápido porque cada área só é baixada quando a pessoa a acessa pela primeira vez.

**Why this priority**: melhora a abertura em celulares e conexões lentas e evita que o app fique mais
pesado a cada nova tela; não muda nenhum comportamento visível além da velocidade.

**Independent Test**: abrir a tela de entrada e conferir que o conteúdo das áreas não é baixado até
que sejam acessadas; navegar entre áreas normalmente.

**Acceptance Scenarios**:

1. **Given** a pessoa abre a tela de entrada, **When** a página carrega, **Then** o que é baixado
   inicialmente não inclui o código das telas das áreas.
2. **Given** a pessoa acessa uma área pela primeira vez, **When** a tela está sendo baixada, **Then**
   vê um indicador de carregamento no lugar do conteúdo (o menu continua visível).
3. **Given** o download de uma tela falha (ex.: sem conexão), **When** a pessoa tenta abrir a área,
   **Then** vê uma mensagem de erro em português com a opção de tentar de novo.

---

### Edge Cases

- Lista de categorias carregando: exibe esqueleto da lista; falha ao carregar: mensagem com "Tentar
  novamente".
- Nome de categoria com espaços nas pontas é aceito (o sistema remove os espaços).
- Quantidade de lançamentos é atualizada depois de criar, renomear ou remover.
- Saldo inicial com valor zero é aceito.
- Data de referência no futuro é aceita (o sistema não restringe).
- Enquanto um formulário está sendo enviado, o botão de confirmar indica processamento e não pode ser
  acionado de novo; o formulário não fecha.
- Fechar o formulário sem confirmar descarta o que foi digitado.
- Sessão expirada durante qualquer ação: segue a regra da feature 005 (entrada com aviso e volta para
  Configurações).
- Lista longa de categorias continua utilizável no celular (rolagem da página, sem rolagem horizontal).

## Requirements *(mandatory)*

### Functional Requirements

**Categorias**

- **FR-001**: A tela MUST listar as categorias por tipo (despesa e receita), com alternância entre os
  tipos, em ordem alfabética, mostrando a quantidade de lançamentos de cada uma no singular/plural
  correto.
- **FR-002**: A tela MUST permitir criar categoria com nome (obrigatório, até 50 caracteres) e tipo
  (despesa ou receita, pré-selecionado com o tipo visível).
- **FR-003**: A tela MUST permitir renomear uma categoria, sem alterar o tipo.
- **FR-004**: A tela MUST permitir remover uma categoria após confirmação explícita.
- **FR-005**: Recusas do sistema (nome repetido no tipo, categoria com lançamentos) MUST ser exibidas
  como vieram, sem fechar o formulário (criar/renomear) ou mantendo a categoria na lista (remover).
- **FR-006**: Cada tipo sem categorias MUST mostrar estado vazio com as ações "Nova categoria" e
  "Usar sugestões".
- **FR-016**: "Usar sugestões" MUST abrir uma lista marcável de categorias comuns do tipo (despesa:
  Mercado, Moradia, Água, Luz, Internet, Transporte, Cartão de crédito, Saúde, Lazer; receita:
  Salário, 13º salário, Vendas, Outros), todas marcadas por padrão; MUST criar só as marcadas,
  informando quantas foram criadas e exibindo a mensagem do sistema para cada uma que falhar; com
  nenhuma marcada, a confirmação MUST ficar indisponível. Nada é criado sem confirmação.

**Saldo inicial**

- **FR-007**: A tela MUST mostrar o saldo inicial atual (valor formatado em reais, com sinal quando
  negativo, e data de referência no padrão brasileiro) ou o aviso de que ainda não foi informado.
- **FR-008**: A tela MUST explicar que o saldo inicial é o ponto de partida do saldo acumulado no
  resumo do mês.
- **FR-009**: A tela MUST permitir informar ou alterar o saldo inicial com valor em reais (estilo
  app de banco), indicação de saldo negativo e data de referência (obrigatória). Na primeira vez, a
  data MUST vir preenchida com o dia 1º do mês atual, com a dica "Use o saldo que vocês tinham no
  início do mês"; ao alterar, MUST vir com os valores atuais.

**Conta**

- **FR-010**: A tela MUST mostrar nome e e-mail da conta, somente leitura, e a opção de sair.

**Formulários e avisos**

- **FR-011**: Formulários MUST abrir em painel sobreposto: centralizado em telas largas e vindo de
  baixo em telas estreitas; MUST ter título, botão de confirmar com estado de processamento e opção
  de cancelar/fechar.
- **FR-012**: Toda operação concluída com sucesso MUST mostrar um aviso breve em português (ex.:
  "Categoria criada.", "Saldo inicial salvo.").
- **FR-013**: Carregamentos MUST mostrar indicadores visuais; falhas ao carregar MUST mostrar
  mensagem e opção de tentar de novo.

**Desempenho**

- **FR-014**: As telas das áreas do app MUST ser baixadas apenas quando acessadas, com indicador de
  carregamento e tratamento de falha (mensagem e tentar de novo).

**Gerais**

- **FR-015**: Todos os textos MUST estar em português; a tela MUST funcionar a partir de 360 px, por
  teclado e com leitores de tela.

### Key Entities

- **Categoria**: nome, tipo (despesa/receita, fixo após criada) e quantidade de lançamentos
  (calculada pelo sistema).
- **Saldo inicial**: valor (pode ser negativo) e data de referência; no máximo um.
- **Conta**: nome e e-mail (somente leitura).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Criar uma categoria leva menos de 20 segundos a partir da tela de Configurações; criar o
  conjunto inicial de categorias pelas sugestões leva menos de 30 segundos.
- **SC-002**: Informar o saldo inicial leva menos de 30 segundos.
- **SC-003**: 100% das recusas do sistema (nome repetido, categoria com lançamentos) aparecem na tela
  com a mensagem original, sem perda do que foi digitado.
- **SC-004**: Após qualquer criação, alteração ou remoção, a lista e o saldo exibidos refletem a
  mudança sem recarregar a página.
- **SC-005**: O tamanho do que é baixado ao abrir o app (tela de entrada) diminui em pelo menos 30%
  em relação à versão anterior da feature 005.
- **SC-006**: A tela funciona sem rolagem horizontal de 360 px a 1920 px.

## Assumptions

- Depende das features 002/003 (API de categorias com tipo e contagem; saldo inicial) e 005 (layout,
  sessão e componentes compartilhados).
- Editar nome, e-mail ou senha da conta não existe na API e está fora de escopo.
- A alternância Despesas/Receitas abre em "Despesas".
- O saldo negativo é informado por uma opção explícita ("Saldo negativo"), porque o campo de valor em
  reais aceita só dígitos.
- Fora de escopo: telas de despesas, receitas, contas fixas, pessoas e resumo; tema escolhido pelo
  usuário; importação de categorias.
