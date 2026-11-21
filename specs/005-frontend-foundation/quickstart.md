# Quickstart: validar a Fundação do Frontend

**Feature**: `005-frontend-foundation`

Contrato em [contracts/ui.md](contracts/ui.md); estados e validações em [data-model.md](data-model.md).

## Pré-requisitos

- API rodando no perfil `http` (porta 5193):

```powershell
dotnet run --project backend/src/Backend/Hozelo.Api
```

- Frontend:

```powershell
npm --prefix frontend run dev
```

## Verificação automática

```powershell
npm --prefix frontend test
```
```powershell
npm --prefix frontend run lint
```
```powershell
npm --prefix frontend run build
```

## Cenários manuais

| # | Ação | Resultado esperado | Spec |
|---|---|---|---|
| 1 | Abrir `/despesas` sem sessão | vai para `/entrar?voltar=/despesas` | US4-4 |
| 2 | Entrar com senha errada | mensagem da API; e-mail mantido | US1-2 |
| 3 | Entrar com dados certos | volta para `/despesas`; nome da conta no menu | US1-1, US3-4 |
| 4 | Recarregar a página | continua conectado | US3-1 |
| 5 | Sair; entrar com "Manter conectado" desmarcado; fechar e reabrir o navegador | precisa entrar de novo | US3-5 |
| 6 | Criar conta com uma conta já existente | mensagem de conta existente + link para a entrada | US2-2 |
| 7 | Navegar pelas seis áreas no computador | menu lateral destaca a atual; páginas "em construção" | US4-1, US4-3 |
| 8 | Largura de celular (≤ 767 px) | barra no rodapé com 4 áreas + "Mais"; "Mais" abre o resto e Sair | US4-2 |
| 9 | Apagar a sessão do servidor (ou token inválido) e navegar | entrada com "Sua sessão expirou. Entre novamente." | US3-3 |
| 10 | Abrir `/xyz` | "Página não encontrada" com atalho para o início | US4-6 |
| 11 | Parar a API e tentar entrar | "Não foi possível conectar..." | Edge case |
| 12 | Navegar só com Tab/Enter | todas as opções alcançáveis, foco visível | US4-7 |
| 13 | Largura de 360 px | sem rolagem horizontal | SC-006 |
