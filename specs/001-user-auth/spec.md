# Feature Specification: Cadastro e Login de Usuário

**Feature Branch**: `001-user-auth`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Cadastro e login de usuário. A família usa uma única conta
compartilhada (um login para todos). A pessoa cria a conta informando nome, e-mail e senha;
o e-mail deve ser único e a senha deve ter no mínimo 8 caracteres. Depois faz login com e-mail
e senha e recebe um token JWT, exigido em todos os demais endpoints. O usuário autenticado
consegue visualizar o próprio perfil (nome e e-mail). Mensagens ao usuário em português.
Fora de escopo: recuperação de senha, troca de senha, login social, múltiplos membros/convites
da família."

## Clarifications

### Session 2026-11-21

- Q: Quem pode criar uma conta no Hozelo? → A: Cadastro permitido só enquanto não existe
  nenhuma conta; após a primeira, novos cadastros são recusados.
- Q: Por quanto tempo a pessoa continua logada antes de precisar entrar de novo? → A: 7 dias.
- Q: O sistema deve bloquear temporariamente o login após várias senhas erradas seguidas?
  → A: Sim; após 5 tentativas erradas seguidas, login bloqueado por 15 minutos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Criar a conta da família (Priority: P1)

Um membro da família acessa o Hozelo pela primeira vez e cria a conta compartilhada informando
nome, e-mail e senha. Ao concluir, já fica autenticado e pode começar a usar o sistema sem
precisar fazer login em seguida.

**Why this priority**: sem conta não existe nenhum uso possível do sistema; é a porta de
entrada de todas as funcionalidades financeiras futuras.

**Independent Test**: pode ser testado criando uma conta com dados válidos e verificando que
o sistema confirma o cadastro e devolve uma credencial de acesso válida.

**Acceptance Scenarios**:

1. **Given** ainda não existe nenhuma conta no sistema, **When** a pessoa envia nome, e-mail
   e senha válidos, **Then** a conta é criada e a pessoa recebe o nome cadastrado e uma
   credencial de acesso.
2. **Given** já existe uma conta no sistema, **When** qualquer pessoa tenta um novo cadastro
   (com qualquer e-mail, inclusive o já cadastrado), **Then** o cadastro é recusado com a
   mensagem "Já existe uma conta cadastrada. Faça login para continuar.".
3. **Given** a pessoa informa senha com menos de 8 caracteres, **When** envia o cadastro,
   **Then** o cadastro é recusado com mensagem em português indicando o tamanho mínimo.
4. **Given** a pessoa deixa nome, e-mail ou senha em branco, ou informa e-mail em formato
   inválido, **When** envia o cadastro, **Then** o cadastro é recusado e todas as mensagens de
   erro aplicáveis são devolvidas juntas, em português.

---

### User Story 2 - Entrar na conta (Priority: P1)

Qualquer membro da família, usando o e-mail e a senha da conta compartilhada, entra no Hozelo
e recebe uma credencial de acesso que permite usar as demais funcionalidades.

**Why this priority**: é como a família volta a usar o sistema no dia a dia; sem login a
conta criada não tem utilidade após a primeira sessão.

**Independent Test**: pode ser testado fazendo login com uma conta existente e verificando
que a credencial devolvida dá acesso a uma área protegida.

**Acceptance Scenarios**:

1. **Given** uma conta existente, **When** a pessoa informa e-mail e senha corretos,
   **Then** recebe o nome da conta e uma credencial de acesso válida.
2. **Given** uma conta existente, **When** a pessoa informa a senha errada, **Then** o acesso
   é negado com a mensagem "E-mail e/ou senha inválidos".
3. **Given** nenhum cadastro com o e-mail informado, **When** a pessoa tenta entrar,
   **Then** o acesso é negado com a mesma mensagem "E-mail e/ou senha inválidos", sem
   revelar se o e-mail existe.
4. **Given** ocorreram 5 tentativas de login erradas seguidas, **When** alguém tenta entrar
   nos 15 minutos seguintes (mesmo com e-mail e senha corretos), **Then** o acesso é negado
   com a mensagem "Muitas tentativas de login. Tente novamente em alguns minutos.".
5. **Given** o bloqueio de 15 minutos terminou, **When** a pessoa informa e-mail e senha
   corretos, **Then** entra normalmente e a contagem de tentativas erradas é zerada.

---

### User Story 3 - Ver o perfil da conta (Priority: P2)

Um membro da família já autenticado consulta os dados da conta (nome e e-mail) para confirmar
em qual conta está conectado.

**Why this priority**: valida de ponta a ponta que a credencial protege o acesso e que o
sistema identifica a conta autenticada, base para todas as funcionalidades futuras.

**Independent Test**: pode ser testado consultando o perfil com uma credencial válida e,
depois, sem credencial ou com credencial inválida.

**Acceptance Scenarios**:

1. **Given** a pessoa está autenticada, **When** consulta o perfil, **Then** vê o nome e o
   e-mail da conta, sem nenhum dado de senha.
2. **Given** a pessoa não envia credencial, ou envia credencial inválida ou expirada,
   **When** tenta consultar o perfil, **Then** o acesso é negado com mensagem em português
   informando que é preciso estar autenticado.

---

### Edge Cases

- E-mail informado com espaços no início/fim ou letras maiúsculas: é normalizado (sem espaços,
  minúsculo) antes de ser armazenado e antes do login.
- Senha com exatamente 8 caracteres: é aceita.
- Dois cadastros simultâneos quando ainda não há conta: apenas um é criado; o outro recebe
  "Já existe uma conta cadastrada. Faça login para continuar.".
- Cadastro com dados inválidos quando já existe conta: prevalece a recusa por conta existente.
- Tentativas de login erradas com e-mail inexistente também contam para o bloqueio, para que o
  bloqueio não revele qual é o e-mail da conta.
- Login correto antes de atingir 5 erros: a contagem de tentativas erradas é zerada.
- Tentativas feitas durante o bloqueio não estendem o prazo de 15 minutos.
- Credencial adulterada ou assinada por outra origem: é rejeitada como inválida.
- Credencial de uma conta que deixou de existir: o acesso é negado.
- Nome com espaços no início/fim: é armazenado sem esses espaços; nome só com espaços é
  tratado como vazio.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir criar uma conta informando nome, e-mail e senha.
- **FR-002**: O sistema MUST exigir nome, e-mail e senha preenchidos no cadastro.
- **FR-003**: O sistema MUST validar o formato do e-mail no cadastro.
- **FR-004**: O sistema MUST recusar senhas com menos de 8 caracteres.
- **FR-005**: O sistema MUST permitir o cadastro somente enquanto não existir nenhuma conta;
  havendo uma conta, todo novo cadastro MUST ser recusado, garantindo uma única conta no
  sistema.
- **FR-006**: O sistema MUST devolver, após cadastro bem-sucedido, o nome da conta e uma
  credencial de acesso, dispensando um login separado.
- **FR-007**: O sistema MUST permitir entrar na conta com e-mail e senha, devolvendo o nome da
  conta e uma credencial de acesso.
- **FR-008**: O sistema MUST responder com a mesma mensagem genérica ("E-mail e/ou senha
  inválidos") tanto para e-mail inexistente quanto para senha incorreta.
- **FR-009**: O sistema MUST exigir credencial de acesso válida em todas as funcionalidades,
  exceto cadastro e login.
- **FR-010**: A credencial de acesso MUST expirar 7 dias após ser emitida, exigindo novo
  login; o prazo MUST ser configurável sem alteração de código.
- **FR-011**: O sistema MUST permitir que a conta autenticada consulte seu nome e e-mail.
- **FR-012**: O sistema MUST NOT armazenar nem devolver a senha em formato legível em nenhuma
  situação.
- **FR-013**: Todas as mensagens destinadas ao usuário (validação, autenticação e erros) MUST
  estar em português.
- **FR-014**: Quando houver múltiplos erros de validação, o sistema MUST devolver todos de uma
  vez, e não apenas o primeiro.
- **FR-015**: Após 5 tentativas de login erradas seguidas (com qualquer e-mail), o sistema MUST
  recusar todo login por 15 minutos, inclusive com credenciais corretas, informando
  "Muitas tentativas de login. Tente novamente em alguns minutos."; um login bem-sucedido MUST
  zerar a contagem. Limite e duração MUST ser configuráveis sem alteração de código.

### Key Entities

- **Conta (User)**: representa a conta compartilhada da família. Atributos: nome, e-mail
  (único, normalizado), senha protegida, identificador público, data de criação e indicação
  de conta ativa. Será a dona de todos os dados financeiros nas funcionalidades futuras.
- **Controle de tentativas de login**: quantidade de tentativas erradas seguidas e momento até
  o qual o login está bloqueado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa consegue criar a conta em menos de 1 minuto, preenchendo apenas 3
  campos.
- **SC-002**: Uma pessoa com a conta já criada consegue entrar em menos de 15 segundos.
- **SC-003**: 100% das tentativas de acessar funcionalidades protegidas sem credencial
  válida são negadas.
- **SC-004**: 100% das tentativas de cadastro feitas depois que a conta da família existe são
  recusadas; o sistema nunca contém mais de uma conta.
- **SC-005**: Nenhuma resposta do sistema permite distinguir se um e-mail está cadastrado a
  partir de uma tentativa de login.
- **SC-006**: Após 5 senhas erradas seguidas, 100% das tentativas de login nos 15 minutos
  seguintes são recusadas.
- **SC-007**: 100% das mensagens exibidas ao usuário nesta funcionalidade estão em português.

## Assumptions

- A família usa uma única conta compartilhada; não há distinção de quem fez cada ação.
- O cadastro só está disponível na primeira utilização (enquanto não há conta); depois disso o
  sistema é de uso exclusivo da conta da família.
- A credencial de acesso vale 7 dias; não há renovação automática nesta versão.
- Nome tem até 100 caracteres; e-mail até 255; senha sem limite máximo prático além de um
  teto de segurança (definido no plano). Não há regra de complexidade além do tamanho mínimo.
- Não há confirmação de e-mail nesta versão.
- Como existe uma única conta, o bloqueio por tentativas é global: alguém que erre senhas de
  propósito pode impedir o login da família por até 15 minutos, risco aceito para esta escala.
- Fora de escopo: recuperação e troca de senha, login social, logout no servidor, exclusão ou
  edição da conta, múltiplos membros e convites da família, frontend.
- Esta é a primeira funcionalidade com persistência; depende da preparação inicial do
  armazenamento de dados do sistema.
