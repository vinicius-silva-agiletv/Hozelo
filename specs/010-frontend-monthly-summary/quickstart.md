# Quickstart: validar a Tela de Resumo do Mês

**Feature**: `010-frontend-monthly-summary`

Contrato em [contracts/ui.md](contracts/ui.md); derivações e endereço em [data-model.md](data-model.md).

## Pré-requisitos

API (porta 5193) e frontend rodando, com uma conta e, para o cenário completo: saldo inicial no dia
1º do mês anterior, salário recorrente, uma receita avulsa, uma despesa parcelada, uma conta fixa e
uma pessoa com conta fixa dividida — deixando algo do mês anterior sem pagar/receber:

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

O JS inicial deve continuar perto de 339 kB (a tela fica num pacote sob demanda).

## Cenários manuais

| # | Ação | Resultado esperado | Spec |
|---|---|---|---|
| 1 | Abrir o app (`/`) | destaque "Saldo no fim do mês" com "veio de {mês anterior}" e "projeção de fechamento" | US2-1, US2-2, SC-001 |
| 2 | Conferir previsto e realizado | iguais ao `GET /api/summaries` do mês | US1-1, US1-2, SC-003 |
| 3 | Voltar um mês | legenda "fechamento realizado"; pendências não aparecem | US2-3, US3-5 |
| 4 | Mês atual com algo de mês anterior em aberto | "Pendências de meses anteriores" com a pagar/a receber e os itens | US3-1 |
| 5 | Marcar uma pendência de conta fixa como paga | sai das pendências; acumulado do mês igual | US3-2 |
| 6 | Tocar numa pendência de reembolso | abre a pessoa no mês | US3-3 |
| 7 | Aba Saídas, marcar uma parcela como paga | realizado muda; aviso | US4-5 (saída) |
| 8 | Aba Entradas, marcar o 13º como recebido e desfazer | realizado muda e volta | US4-5 |
| 9 | Tocar em itens de cada tipo | abre o detalhe na tela certa | US4-3, SC-004 |
| 10 | Filtrar por uma categoria | listas e totais filtrados; destaque vira "Saldo previsto do mês" com a explicação | US2-6, US4-2 |
| 11 | Apagar o saldo inicial (ou usar conta sem ele) | aviso com link "Informar saldo inicial" | US2-4 |
| 12 | Mês futuro sem lançamentos | zerado com links para Despesas e Receitas | US1-5 |
| 13 | Largura 360 px | sem rolagem horizontal; valores sem corte | FR-012 |
