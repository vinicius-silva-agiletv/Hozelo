# Quickstart: validar a Tela de Configurações

**Feature**: `006-frontend-settings`

Contrato em [contracts/ui.md](contracts/ui.md); validações e estados em [data-model.md](data-model.md).

## Pré-requisitos

API (porta 5193) e frontend rodando, com a conta da família criada:

```powershell
dotnet run --project backend/src/Backend/Hozelo.Api
```
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

Conferir no build que o arquivo JS inicial ficou ao menos 30% menor que 563 kB (SC-005).

## Cenários manuais

| # | Ação | Resultado esperado | Spec |
|---|---|---|---|
| 1 | Abrir Configurações sem categorias | estados vazios com "Nova categoria" e "Usar sugestões" | US1-2 |
| 2 | "Usar sugestões" em Despesas, desmarcar 2, confirmar | 7 categorias criadas, aviso "7 categorias criadas." | US1-7 |
| 3 | Criar "luz" em Despesas | mensagem "Já existe uma categoria com esse nome." | US1-4 |
| 4 | Criar "Carro" em Receitas (existindo em Despesas) | aceito | US1-5 |
| 5 | Renomear "Lazer" para "Passeios" | lista atualizada em ordem alfabética | US2-1 |
| 6 | Remover categoria sem lançamentos | confirmação; some da lista | US2-3 |
| 7 | Remover categoria com lançamentos | mensagem da API no diálogo; continua na lista | US2-4 |
| 8 | "Informar saldo inicial" | data já com dia 1º do mês atual e a dica | US3-6 |
| 9 | Salvar R$ 3.200,00 | "R$ 3.200,00 em 01/mm/aaaa" | US3-2 |
| 10 | Alterar para negativo R$ 450,00 | "−R$ 450,00" destacado | US3-3 |
| 11 | Ver seção Conta e Sair | nome e e-mail; Sair leva à entrada | US4 |
| 12 | Largura 360 px | formulários vêm de baixo; sem rolagem horizontal | FR-011, SC-006 |
| 13 | DevTools → Rede, abrir `/entrar` e depois Configurações | código das áreas baixado só ao acessar | US5-1 |
