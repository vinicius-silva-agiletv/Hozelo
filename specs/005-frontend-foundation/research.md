# Research: Fundação do Frontend (Acesso e Navegação)

**Feature**: `005-frontend-foundation` | **Date**: 2026-11-21

Decisões técnicas (Decision / Rationale / Alternatives). Base já instalada no setup do frontend:
Vite 8, React 19, TypeScript, Tailwind 4, shadcn/ui, React Router, TanStack Query, React Hook Form +
Zod, Sonner, Vitest + Testing Library; cliente `src/lib/api.ts`.

## 1. Onde guardar a sessão ("Manter conectado")

- **Decision**: guardar o token e o nome da conta em `localStorage` quando "Manter conectado" está
  marcado e em `sessionStorage` quando desmarcado (sobrevive a recargas, some ao fechar o
  navegador). Ao ler, procurar nos dois; ao salvar ou sair, limpar os dois.
- **Rationale**: atende FR-007 sem backend novo (a API só emite o JWT de 7 dias).
- **Alternatives considered**: cookie httpOnly (exigiria mudar a API para emitir cookie e tratar
  CSRF; fora do escopo); manter só em memória (perde a sessão a cada recarga).
- **Risco aceito**: token acessível a scripts da página (XSS). Mitigado por não usar HTML não
  confiável (`dangerouslySetInnerHTML` proibido) e pela validade limitada do token.

## 2. Expiração da sessão

- **Decision**: ao iniciar, ler o `exp` do JWT (decodificação base64url do payload, sem
  biblioteca) e descartar sessão já expirada antes de renderizar áreas protegidas. Em uso, qualquer
  401 de uma requisição **que enviou token** encerra a sessão (FR-009).
- **Rationale**: evita "piscar" a área protegida com sessão vencida; o 401 cobre token adulterado,
  conta removida e expiração durante o uso.
- **Importante**: o `POST /login` devolve 401 para senha errada; como essa requisição não envia
  token, ela **não** dispara o encerramento de sessão e a mensagem da API é mostrada no formulário.
- **Alternatives considered**: `jwt-decode` (dependência para 5 linhas de código).

## 3. Encerramento por 401 e volta à área anterior

- **Decision**: `src/lib/api.ts` expõe `setUnauthorizedHandler(fn)`; o `SessionProvider` registra
  uma função que limpa a sessão, limpa o cache do TanStack Query e navega para
  `/entrar?expirada=1&voltar=<caminho atual>`. A tela de entrada mostra "Sua sessão expirou. Entre
  novamente." quando `expirada=1` e, após entrar, navega para `voltar` (só caminhos internos,
  começando com `/` e sem `//`, para evitar redirecionamento aberto).
- **Rationale**: o cliente HTTP não conhece o roteador; o handler injetado mantém a regra num
  lugar só (constituição IV).

## 4. Perfil e nome no menu

- **Decision**: o nome da conta vem da resposta de entrar/cadastrar (`name`) e é salvo com a
  sessão para exibição imediata; o hook `useProfile()` (`GET /users`) confirma a sessão ao abrir o
  app e atualiza o nome (staleTime longo).
- **Rationale**: menu com nome sem esperar requisição; a consulta ao perfil também detecta sessão
  inválida logo na abertura (401 → entrada).

## 5. Rotas e proteção

- **Decision**: rotas declarativas com React Router em `src/app/router.tsx`:
  - públicas (layout de acesso): `/entrar`, `/cadastro` — com sessão, redirecionam para `/`;
  - protegidas (layout do app): `/` (Resumo do mês), `/despesas`, `/receitas`, `/contas-fixas`,
    `/pessoas`, `/configuracoes` — sem sessão, redirecionam para `/entrar?voltar=...`;
  - `*` → página 404.
  Componentes de guarda `RequireAuth` e `RedirectIfAuthenticated` envolvem os layouts.
- **URLs em português**: são texto de interface (aparecem para a família); código continua em
  inglês (constituição II).
- **Alternatives considered**: data routers (`createBrowserRouter` com loaders) — mais recursos do
  que o necessário agora; reavaliar quando houver carregamento por rota.

## 6. Áreas do menu (configuração única)

- **Decision**: `src/app/navigation.ts` lista as seis áreas (`label`, `path`, `icon` Lucide,
  `primaryOnMobile`). Menu lateral, barra do rodapé, painel "Mais" e títulos de aba usam a mesma
  lista.
- **Rationale**: uma fonte só evita menus divergentes (SC-005).

## 7. Layout responsivo

- **Decision**: a partir de `md` (768 px): menu lateral fixo (largura 240 px) com nome da conta e
  Sair no rodapé do menu. Abaixo de `md`: barra fixa no rodapé com Resumo, Despesas, Receitas,
  Pessoas e "Mais" (abre `Sheet` do shadcn/ui pela parte de baixo com Contas fixas, Configurações,
  nome e Sair). O conteúdo ganha espaçamento inferior igual à altura da barra +
  `env(safe-area-inset-bottom)` (FR-013).
- **Alternatives considered**: componente `Sidebar` completo do shadcn (mais complexo que o
  necessário para seis itens).

## 8. Título da aba

- **Decision**: hook `useDocumentTitle(title)` → `"<área> · Hozelo"`; telas de acesso usam
  "Entrar · Hozelo" / "Criar conta · Hozelo".

## 9. Falha de conexão

- **Decision**: em `src/lib/api.ts`, erro de rede do `fetch` vira `ApiError` com status `0` e a
  mensagem "Não foi possível conectar. Verifique sua conexão e tente novamente." (FR-010); não
  encerra a sessão.

## 10. Formulários de acesso

- **Decision**: React Hook Form + Zod (`schemas.ts` da feature `auth`), campos com os componentes
  `Field` do shadcn/ui; validação no envio e depois a cada alteração; mensagens em português iguais
  às regras do backend (e-mail obrigatório/válido, senha obrigatória, mínimo 8 no cadastro, nome
  obrigatório até 100). Erros da API aparecem num alerta acima do botão (todas as mensagens).
- **409 no cadastro**: o alerta inclui o link "Ir para a entrada".

## 11. Campo de valor em reais (estilo app de banco)

- **Decision**: componente controlado `MoneyInput` que guarda o valor em **centavos inteiros**:
  cada dígito digitado faz `centavos = centavos * 10 + dígito`; Backspace faz
  `centavos = floor(centavos / 10)`; colar extrai o valor (`"1.250,50"`, `"1250.5"`) e converte
  para centavos; limite 999.999.999.999 centavos; exibe `formatCurrency(centavos / 100)`;
  `inputMode="numeric"`; entrega `number` com 2 casas (`centavos / 100`). Integra com React Hook
  Form via `Controller`.
- **Rationale**: FR-017 e clarify (estilo app de banco); centavos inteiros evitam erro de ponto
  flutuante.

## 12. Seletor de mês

- **Decision**: `MonthPicker` controlado com valor `"yyyy-MM"` (mesmo formato da API); botões
  anterior/próximo (com `aria-label`), rótulo "novembro de 2026" via `Intl.DateTimeFormat('pt-BR',
  { month: 'long', year: 'numeric' })` e botão "Mês atual"; limites 2000-01 a 2100-12 desabilitam
  os botões. Utilitários puros em `src/lib/month.ts` (somar meses, formatar, mês atual).

## 13. Testes

- **Decision**: Vitest + Testing Library com `fetch` simulado por um helper
  (`src/test/mock-api.ts`: mapa `"MÉTODO /caminho" → resposta`), sem MSW por enquanto (YAGNI).
  Cobrir: utilitários (`month`, conversões do `MoneyInput`, decodificação do JWT, armazenamento da
  sessão), cliente HTTP (401 com/sem token, erro de rede), guardas de rota, fluxos de entrar,
  cadastrar, sair e sessão expirada, navegação (lateral/rodapé/"Mais"), 404 e cada componente
  compartilhado.
- **Alternatives considered**: MSW (melhor para muitos endpoints; reavaliar nas próximas
  features).

## 14. Dependências

- **Decision**: nenhuma dependência npm nova. Componentes shadcn/ui extras se necessários
  (`alert`) são adicionados pelo CLI (código no projeto, não pacote).
