# Feature Specification: Fundação do Frontend (Acesso e Navegação)

**Feature Branch**: `005-frontend-foundation`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Fundação do frontend: estrutura de navegação e acesso. Tela de login
(e-mail e senha) e tela de cadastro da conta da família (nome, e-mail, senha), sendo que o cadastro
só faz sentido enquanto não existe conta (a API recusa com 409 depois). Após login ou cadastro, a
pessoa entra no app e a sessão é mantida ao recarregar a página até o token expirar (7 dias) ou a
pessoa sair. Qualquer resposta 401 da API encerra a sessão e leva ao login com aviso. Bloqueio de
429 (muitas tentativas) mostra a mensagem da API. Layout autenticado com menu de navegação para as
áreas do app (Resumo do mês, Despesas, Receitas, Contas fixas, Pessoas, Configurações): menu lateral
no computador e menu adaptado ao celular; mostra o nome da conta (perfil) e a opção de sair. As
áreas ainda não construídas exibem uma página 'em construção'. Rotas protegidas: sem sessão,
qualquer área leva ao login; com sessão, login/cadastro levam ao resumo. Página 404 para rotas
inexistentes. Componentes compartilhados para as próximas telas: campo de valor em reais, seletor de
mês, estado vazio, cabeçalho de página e diálogo de confirmação. Fora de escopo: telas reais de
despesas, receitas, resumo etc. (features seguintes), recuperação de senha, tema escolhido pelo
usuário."

## Clarifications

### Session 2026-11-21

- Q: No celular, o menu é uma barra fixa no rodapé ou um painel lateral? → A: Barra fixa no rodapé
  com Resumo, Despesas, Receitas, Pessoas e "Mais" (que abre Contas fixas, Configurações, nome da
  conta e Sair).
- Q: A sessão fica sempre salva ou há "Manter conectado"? → A: Caixa "Manter conectado" na entrada,
  marcada por padrão: marcada = sessão salva até expirar (7 dias); desmarcada = sessão termina ao
  fechar o navegador.
- Q: Como funciona a digitação no campo de valor em reais? → A: Estilo app de banco: só dígitos,
  entrando pelos centavos, sempre formatado como "R$ 0,00"; apagar remove o último dígito.

## Visão geral

Esta feature entrega a "casca" do aplicativo web que a família vai usar no dia a dia: entrar na
conta, navegar entre as áreas e sair. As telas de conteúdo (resumo do mês, despesas, receitas,
contas fixas, pessoas, configurações) chegam nas features seguintes; aqui elas aparecem no menu e
mostram um aviso de "em construção". Também ficam prontos os elementos visuais reutilizáveis que
todas essas telas vão usar.

```text
Sem sessão                       Com sessão
┌────────────┐                   ┌──────────┬─────────────────────────────┐
│   Entrar   │ ── login ok ───▶  │  Menu    │  Resumo do mês              │
│  (e-mail,  │                   │ ──────── │  (em construção)            │
│   senha)   │ ◀── sair / 401 ── │  Resumo  │                             │
│ Criar conta│                   │  Despesas│                             │
└────────────┘                   │  ...     │                             │
                                 │  Família │  ← nome da conta + Sair     │
                                 └──────────┴─────────────────────────────┘
```

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar na conta (Priority: P1)

Um membro da família abre o Hozelo, informa e-mail e senha da conta compartilhada e chega à tela
inicial do app.

**Why this priority**: sem entrar, nenhuma outra tela pode ser usada.

**Independent Test**: com uma conta existente, entrar com dados corretos, errados e após várias
tentativas erradas.

**Acceptance Scenarios**:

1. **Given** a pessoa não está conectada, **When** informa e-mail e senha corretos e confirma,
   **Then** chega ao Resumo do mês e vê o nome da conta no menu.
2. **Given** e-mail ou senha errados, **When** confirma, **Then** continua na tela de entrada e vê
   a mensagem enviada pelo sistema ("E-mail e/ou senha inválidos."), sem perder o e-mail digitado.
3. **Given** o sistema bloqueou o acesso por muitas tentativas, **When** a pessoa tenta entrar,
   **Then** vê a mensagem de bloqueio enviada pelo sistema.
4. **Given** a pessoa deixa e-mail ou senha em branco, **When** confirma, **Then** vê, junto de cada
   campo, que ele é obrigatório, sem enviar a tentativa.
5. **Given** a tentativa está em andamento, **When** a pessoa espera, **Then** o botão de entrar
   indica que está processando e não pode ser acionado de novo.
6. **Given** a tela de entrada, **When** a pessoa a abre, **Then** vê a opção "Manter conectado"
   marcada; se desmarcar antes de entrar, a sessão termina quando o navegador for fechado.

---

### User Story 2 - Criar a conta da família (Priority: P1)

Na primeira vez, um membro da família cria a conta compartilhada (nome, e-mail e senha) e já entra
no app.

**Why this priority**: é o primeiro uso do sistema; sem conta não há login.

**Independent Test**: com o sistema sem conta, criar a conta; depois, tentar criar outra.

**Acceptance Scenarios**:

1. **Given** ainda não existe conta, **When** a pessoa preenche nome, e-mail e senha válidos e
   confirma, **Then** a conta é criada e ela chega ao Resumo do mês já conectada.
2. **Given** já existe uma conta, **When** alguém tenta criar outra, **Then** vê a mensagem enviada
   pelo sistema ("Já existe uma conta cadastrada. Faça login para continuar.") e um atalho para a
   tela de entrada.
3. **Given** a pessoa informa dados inválidos (campos em branco, e-mail em formato inválido, senha
   com menos de 8 caracteres), **When** confirma, **Then** vê o problema junto de cada campo antes
   de enviar; se o sistema recusar por outros motivos, vê todas as mensagens enviadas por ele.
4. **Given** a pessoa está na tela de entrada, **When** escolhe "Criar conta", **Then** vai para a
   tela de cadastro, e vice-versa.

---

### User Story 3 - Manter a sessão e sair (Priority: P1)

A pessoa continua conectada ao recarregar a página ou voltar depois, até a sessão expirar ou ela
escolher sair.

**Why this priority**: entrar a cada recarga tornaria o uso diário inviável; sair é necessário em
computadores compartilhados.

**Independent Test**: entrar, recarregar, fechar e reabrir a página, sair, e simular sessão expirada.

**Acceptance Scenarios**:

1. **Given** a pessoa entrou com "Manter conectado" marcado, **When** recarrega a página ou volta
   mais tarde (dentro da validade da sessão), **Then** continua conectada, na mesma área em que
   estava.
2. **Given** a pessoa está conectada, **When** escolhe "Sair", **Then** volta para a tela de entrada
   e, ao tentar abrir qualquer área, é levada para a entrada.
3. **Given** a sessão expirou ou deixou de ser válida, **When** qualquer tela consulta o sistema,
   **Then** a sessão é encerrada, a pessoa vai para a tela de entrada e vê o aviso "Sua sessão
   expirou. Entre novamente.".
4. **Given** a pessoa foi levada à entrada por sessão expirada a partir de uma área, **When** entra
   de novo, **Then** volta para a área em que estava.
5. **Given** a pessoa entrou com "Manter conectado" desmarcado, **When** recarrega a página,
   **Then** continua conectada; **When** fecha o navegador e o abre de novo, **Then** precisa
   entrar novamente.

---

### User Story 4 - Navegar entre as áreas (Priority: P1)

Conectada, a pessoa usa o menu para ir às áreas do app: Resumo do mês, Despesas, Receitas, Contas
fixas, Pessoas e Configurações. O menu mostra o nome da conta e a opção de sair.

**Why this priority**: é a estrutura sobre a qual todas as próximas telas serão construídas.

**Independent Test**: navegar por todas as áreas no computador e no celular.

**Acceptance Scenarios**:

1. **Given** a pessoa está no computador, **When** abre o app, **Then** vê o menu fixo na lateral
   com as seis áreas, destacando a área atual, e o nome da conta com a opção de sair.
2. **Given** a pessoa está no celular, **When** abre o app, **Then** vê uma barra fixa no rodapé com
   Resumo, Despesas, Receitas, Pessoas e "Mais", destacando a área atual; "Mais" abre um painel com
   Contas fixas, Configurações, o nome da conta e Sair, que se fecha ao escolher uma opção.
3. **Given** uma área ainda não construída, **When** a pessoa a abre, **Then** vê o título da área e
   um aviso de que ela está em construção.
4. **Given** a pessoa não está conectada, **When** tenta abrir qualquer área pelo endereço, **Then**
   é levada para a tela de entrada.
5. **Given** a pessoa está conectada, **When** tenta abrir a tela de entrada ou de cadastro, **Then**
   é levada para o Resumo do mês.
6. **Given** um endereço que não existe, **When** a pessoa o abre, **Then** vê uma página "Página
   não encontrada" com um atalho para o início.
7. **Given** a pessoa usa só o teclado, **When** navega pelo menu e pelos formulários, **Then**
   consegue alcançar e acionar todas as opções, com o foco sempre visível.

---

### User Story 5 - Elementos visuais compartilhados (Priority: P2)

As próximas telas terão à disposição elementos prontos e consistentes: campo de valor em reais,
seletor de mês, estado vazio, cabeçalho de página e diálogo de confirmação.

**Why this priority**: não é visível sozinho para a família, mas garante consistência e acelera as
features seguintes; pode ser entregue depois do acesso e da navegação.

**Independent Test**: usar cada elemento isoladamente e conferir comportamento e formatação.

**Acceptance Scenarios**:

1. **Given** o campo de valor em reais vazio ("R$ 0,00"), **When** a pessoa digita 1, 2, 5, 0, 5 e 0,
   **Then** o campo mostra "R$ 0,01", "R$ 0,12", "R$ 1,25", "R$ 12,50", "R$ 125,05" e por fim
   "R$ 1.250,50", e entrega o valor 1250.50; letras e outros símbolos são ignorados; apagar remove o
   último dígito ("R$ 1.250,50" → "R$ 125,05"). No celular, abre o teclado numérico.
2. **Given** o seletor de mês, **When** a pessoa avança ou volta, **Then** o mês muda de um em um
   (ex.: "novembro de 2026" → "dezembro de 2026" → "janeiro de 2027"), e há um atalho para o mês
   atual.
3. **Given** uma lista sem itens, **When** a tela usa o estado vazio, **Then** mostra um ícone, uma
   mensagem explicativa e, opcionalmente, um botão de ação (ex.: "Registrar despesa").
4. **Given** o cabeçalho de página, **When** uma tela o usa, **Then** mostra título, descrição
   opcional e ações à direita no computador (abaixo do título no celular).
5. **Given** uma ação destrutiva (ex.: remover), **When** a tela pede confirmação, **Then** o diálogo
   mostra o que será feito, com "Cancelar" e o botão de confirmação destacado; durante a operação
   o botão indica processamento.

---

### Edge Cases

- E-mail digitado com espaços nas pontas ou letras maiúsculas é aceito (o sistema normaliza).
- Sem conexão com o sistema (servidor fora do ar ou rede caída): a tela mostra "Não foi possível
  conectar. Verifique sua conexão e tente novamente." e permite tentar de novo.
- Duas abas abertas: sair em uma faz a outra levar à entrada na próxima consulta ao sistema.
- Sessão expira enquanto a pessoa preenche um formulário: ao enviar, vai para a entrada com o aviso
  de sessão expirada (o que estava digitado pode ser perdido nesta versão).
- Mensagens recebidas do sistema são exibidas exatamente como vieram.
- Nome da conta muito longo é encurtado no menu, com o nome completo disponível ao passar o mouse
  ou focar.
- Tela muito estreita (a partir de 360 px de largura) continua utilizável, sem rolagem horizontal.
- Seletor de mês respeita o intervalo aceito pelo sistema (de 2000 a 2100).

## Requirements *(mandatory)*

### Functional Requirements

**Acesso**

- **FR-001**: O sistema MUST oferecer uma tela de entrada com e-mail e senha e um atalho para criar
  conta.
- **FR-002**: O sistema MUST oferecer uma tela de cadastro com nome, e-mail e senha e um atalho
  para a entrada.
- **FR-003**: Os formulários MUST validar antes de enviar: campos obrigatórios, formato de e-mail e,
  no cadastro, senha com no mínimo 8 caracteres e nome com até 100 caracteres; os problemas MUST
  aparecer junto de cada campo.
- **FR-004**: Mensagens de erro recebidas do sistema (credenciais inválidas, conta já existente,
  bloqueio por tentativas, validação) MUST ser exibidas na tela como vieram, todas quando houver
  mais de uma.
- **FR-005**: Quando o cadastro é recusado porque já existe conta, a tela MUST oferecer um atalho
  para a entrada.
- **FR-006**: Durante o envio, o botão principal MUST indicar processamento e impedir envios
  repetidos.

**Sessão**

- **FR-007**: A tela de entrada MUST ter a opção "Manter conectado", marcada por padrão. Marcada, a
  sessão MUST ser mantida entre recargas e reaberturas do navegador até expirar ou a pessoa sair;
  desmarcada, MUST ser mantida entre recargas mas terminar ao fechar o navegador. Após criar a
  conta, a sessão MUST seguir o comportamento de "Manter conectado" marcado.
- **FR-008**: "Sair" MUST encerrar a sessão neste navegador e levar à tela de entrada.
- **FR-009**: Qualquer resposta de sessão inválida ou expirada vinda do sistema MUST encerrar a
  sessão, levar à entrada e mostrar "Sua sessão expirou. Entre novamente."; após entrar de novo, a
  pessoa MUST voltar à área em que estava.
- **FR-010**: Falhas de conexão MUST mostrar mensagem amigável em português com opção de tentar
  novamente, sem encerrar a sessão.

**Navegação**

- **FR-011**: Áreas do app (Resumo do mês, Despesas, Receitas, Contas fixas, Pessoas,
  Configurações) MUST exigir sessão; sem sessão, MUST levar à entrada.
- **FR-012**: Com sessão, as telas de entrada e cadastro MUST levar ao Resumo do mês.
- **FR-013**: O layout conectado MUST ter menu com as seis áreas, destaque da área atual, nome da
  conta e opção de sair: em telas largas, fixo na lateral; em telas estreitas, barra fixa no
  rodapé com Resumo, Despesas, Receitas, Pessoas e "Mais", em que "Mais" abre um painel com Contas
  fixas, Configurações, o nome da conta e Sair (fechando ao escolher uma opção). O conteúdo MUST
  NOT ficar escondido atrás da barra do rodapé.
- **FR-014**: Áreas ainda não construídas MUST mostrar o título da área e um aviso de "em
  construção".
- **FR-015**: Endereços inexistentes MUST mostrar "Página não encontrada" com atalho para o início.
- **FR-016**: O título da aba do navegador MUST refletir a área atual (ex.: "Despesas · Hozelo").

**Elementos compartilhados**

- **FR-017**: Campo de valor em reais no estilo app de banco: aceita só dígitos, que entram pelos
  centavos; sempre exibe o valor formatado ("R$ 0,00", "R$ 1.250,50"); apagar remove o último
  dígito; colar um valor (ex.: "1.250,50" ou "1250.5") é convertido corretamente; entrega o valor
  numérico com 2 casas; limite de R$ 9.999.999.999,99; abre o teclado numérico no celular.
- **FR-018**: Seletor de mês: mostra mês e ano por extenso em português, permite avançar e voltar
  um mês, voltar ao mês atual, e limita-se a 2000–2100.
- **FR-019**: Estado vazio: ícone, mensagem e ação opcional.
- **FR-020**: Cabeçalho de página: título, descrição opcional e área de ações, adaptado a telas
  estreitas.
- **FR-021**: Diálogo de confirmação: título, descrição, "Cancelar", botão de confirmação (com
  variante destrutiva) e estado de processamento.

**Gerais**

- **FR-022**: Todo texto de interface MUST estar em português; valores em reais e datas no padrão
  brasileiro.
- **FR-023**: A interface MUST ser utilizável a partir de 360 px de largura, por teclado e com
  leitores de tela (campos com rótulo, foco visível, menus e diálogos acessíveis).

### Key Entities

- **Sessão**: credencial de acesso da conta da família guardada neste navegador, com o nome da
  conta para exibição; existe entre a entrada e a saída (ou expiração).
- **Área do app**: destino de navegação com nome, endereço e ícone (as seis áreas do menu).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa com a conta criada entra no app em menos de 15 segundos a partir da tela
  de entrada.
- **SC-002**: O primeiro acesso (criar a conta e chegar ao app) leva menos de 1 minuto.
- **SC-003**: 100% das tentativas de abrir uma área sem sessão terminam na tela de entrada.
- **SC-004**: Após recarregar a página, a pessoa continua conectada em 100% dos casos dentro da
  validade da sessão; com "Manter conectado" desmarcado, 100% das sessões terminam ao fechar o
  navegador.
- **SC-005**: Todas as seis áreas são alcançáveis em no máximo 2 toques/cliques a partir de
  qualquer tela, no computador e no celular; no celular, Resumo, Despesas, Receitas e Pessoas
  estão a 1 toque.
- **SC-006**: As telas desta feature funcionam sem rolagem horizontal em larguras de 360 px a 1920
  px.
- **SC-007**: 100% dos textos exibidos estão em português.

## Assumptions

- Depende da API da feature 001 (cadastro, entrada, perfil); as áreas de conteúdo dependem das
  features 002–004 e serão construídas nas próximas features do frontend.
- A sessão guardada no navegador vale enquanto a credencial do sistema for válida (7 dias); não há
  renovação automática.
- Não existe consulta "já há conta?"; a tela de cadastro fica sempre acessível pela entrada e a
  recusa do sistema (conta existente) orienta a pessoa a entrar.
- O nome exibido no menu vem do perfil da conta.
- O tema claro/escuro segue a preferência do dispositivo (já configurado); escolha manual de tema
  está fora de escopo.
- Fora de escopo: telas reais de resumo, despesas, receitas, contas fixas, pessoas e configurações;
  recuperação e troca de senha; preservar o que estava digitado quando a sessão expira.
