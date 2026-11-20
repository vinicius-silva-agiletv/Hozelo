# Hozelo Constitution

## Core Principles

### I. Domain-Driven Design e Arquitetura em Camadas

O backend MUST seguir a arquitetura em camadas existente, com dependências apontando sempre
para o domínio:

- `Hozelo.Domain`: entidades, value objects, enums e interfaces de repositório. MUST NOT
  depender de nenhum outro projeto da solution nem de frameworks de infraestrutura (EF Core,
  ASP.NET).
- `Hozelo.Application`: casos de uso (um use case por operação, exposto por interface),
  validadores e mapeamentos. Depende de Domain, Communication e Exception.
- `Hozelo.Infrastructure`: EF Core, migrations (FluentMigrator), PostgreSQL, repositórios, Unit of Work, geração/validação
  de tokens e demais integrações externas. Implementa as interfaces do Domain.
- `Hozelo.Api`: controllers finos, filtros (incluindo filtro global de exceções), configuração
  de DI e autenticação. Controllers MUST NOT conter regra de negócio; apenas delegam ao use case.
- `Hozelo.Communication`: contratos de entrada/saída da API (Request*/Response*). Entidades de
  domínio MUST NOT ser expostas diretamente na API.
- `Hozelo.Exception`: exceções customizadas do projeto e mensagens ao usuário centralizadas
  em resources.

Regras de negócio MUST viver em entidades/value objects ou use cases, nunca em controllers ou
repositórios. Os padrões de referência são os do projeto MyRecipeBook (use cases, validação,
exceções customizadas, repositórios e testes).

**Rationale**: isolamento do domínio mantém regras financeiras testáveis e permite evoluir
infraestrutura (e adicionar o módulo de documentos) sem reescrever o núcleo.

### II. Clean Code e Convenções de Idioma

- Todo código (classes, métodos, variáveis, tabelas, colunas, rotas, commits técnicos) MUST
  estar em inglês.
- Toda mensagem exibida ao usuário (erros de validação, mensagens de exceção, respostas da API)
  MUST estar em português, centralizada em arquivos de resource; strings literais de mensagem
  espalhadas no código são proibidas.
- Nomes MUST ser descritivos e revelar intenção; métodos MUST ter responsabilidade única.
- Comentários explicam o "porquê", não o "o quê". Código morto e comentado MUST ser removido.
- Avisos do compilador relevantes MUST ser tratados; nullable reference types habilitados.

**Rationale**: consistência reduz custo cognitivo; separar idioma de código e de mensagens
prepara o sistema para o frontend e possível internacionalização.

### III. Testes Obrigatórios

- Toda feature MUST vir acompanhada de testes automatizados com xUnit antes do merge.
- Validadores MUST ter testes em `Validators.Tests` cobrindo casos válidos e cada regra
  de invalidação.
- Use cases MUST ter testes em `UseCases.Tests` cobrindo sucesso e falhas de regra de negócio,
  com dependências substituídas por mocks/fakes.
- Endpoints MUST ter testes de integração em `WebApi.Tests` usando `WebApplicationFactory`,
  verificando status HTTP, contrato de resposta e mensagens de erro em português.
- Builders e fakes reutilizáveis MUST ficar em `CommonTestUtilities`.
- TDD é recomendado, mas não obrigatório. Testes quebrados MUST NOT ser mergeados.

**Rationale**: cálculos e saldos financeiros errados destroem a confiança no sistema;
testes são a rede de segurança para evoluir sem regressões.

### IV. Segurança e Integridade dos Dados Financeiros

- Todos os endpoints, exceto cadastro e login, MUST exigir autenticação via JWT.
- Cada consulta e alteração MUST ser restrita aos dados do usuário/família autenticado;
  acessar dados de outro usuário MUST resultar em "não encontrado", sem vazar existência.
- Senhas MUST ser armazenadas apenas como hash com algoritmo adequado (nunca texto puro nem
  criptografia reversível). Segredos (chave JWT, connection string) MUST NOT ser commitados.
- Valores monetários MUST usar `decimal` em C# e `numeric` com precisão definida no PostgreSQL;
  `float`/`double` são proibidos para dinheiro.
- Datas e horários MUST ser persistidos em UTC.
- Toda entrada MUST ser validada na camada Application antes de qualquer persistência.
- Erros MUST retornar respostas padronizadas pelo filtro global de exceções, sem expor stack
  traces ou detalhes internos.

**Rationale**: o sistema guarda dados financeiros privados da família; vazamento ou
imprecisão de valores é inaceitável.

### V. Simplicidade e Escopo Incremental

- O escopo atual é gestão de finanças. O módulo de documentos (PDF e imagens organizados por
  data/categoria) está fora de escopo até ter especificação própria.
- O frontend React está fora de escopo até ter especificação própria; a API MUST ser
  utilizável e documentada (Swagger) de forma independente.
- Cada feature MUST ser entregue em incrementos pequenos e funcionais, seguindo o fluxo
  Spec Kit (specify → plan → tasks → implement).
- Abstrações, pacotes e padrões novos MUST ser justificados por necessidade concreta (YAGNI).

**Rationale**: o objetivo é substituir a planilha da família rapidamente; complexidade
antecipada atrasa valor real.

## Stack e Restrições Técnicas

- **Runtime**: .NET 10 (`net10.0`), ASP.NET Core Web API REST com controllers.
- **Banco de dados**: PostgreSQL. Acesso a dados (consultas e persistência) via Entity
  Framework Core.
- **Migrations**: esquema versionado exclusivamente com FluentMigrator, seguindo o padrão do
  MyRecipeBook. Migrations MUST ser classes C# numeradas sequencialmente na Infrastructure,
  commitadas no repositório e executadas automaticamente na inicialização da API (criando o
  banco se não existir). EF Core Migrations (`dotnet ef migrations`) MUST NOT ser usadas.
  Migrations já aplicadas MUST NOT ser alteradas; mudanças de esquema exigem nova migration.
- **Autenticação**: JWT Bearer.
- **Validação**: FluentValidation na camada Application.
- **Testes**: xUnit, com `WebApplicationFactory` para integração.
- **Documentação da API**: Swagger/OpenAPI habilitado em desenvolvimento.
- **Rotas**: REST, em minúsculas, recursos no plural.
- **Configuração**: `appsettings.*.json` sem segredos; segredos via variáveis de ambiente ou
  user-secrets.
- Novas dependências NuGet MUST ser justificadas no plano da feature.

## Fluxo de Desenvolvimento

- Controle de versão no GitHub. A branch `main` MUST permanecer sempre compilável e com
  testes passando.
- Cada feature MUST ser desenvolvida em branch própria e integrada via Pull Request.
- Commits SHOULD seguir Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`,
  `refactor:`).
- Antes do merge: build sem erros, todos os testes passando e checagem de conformidade com
  esta constitution.
- Artefatos do Spec Kit (spec, plan, tasks) MUST ser commitados junto com a feature.

## Governance

- Esta constitution prevalece sobre outras práticas e convenções do projeto. Conflitos MUST
  ser resolvidos a favor dela ou por emenda formal.
- Emendas MUST ser feitas via `/speckit-constitution`, registradas em commit próprio, com
  justificativa e atualização de versão.
- Versionamento semântico: MAJOR para remoção ou redefinição incompatível de princípios;
  MINOR para princípio ou seção nova ou expansão material; PATCH para esclarecimentos e
  ajustes de redação.
- Todo plano (`/speckit-plan`) MUST incluir verificação de conformidade com estes princípios;
  violações MUST ser justificadas explicitamente na seção de complexidade do plano.

**Version**: 1.1.0 | **Ratified**: 2026-11-20 | **Last Amended**: 2026-11-20
