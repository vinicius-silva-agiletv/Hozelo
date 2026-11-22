# Quickstart: validar a Tela de Pessoas

**Feature**: `009-frontend-people`

Contrato em [contracts/ui.md](contracts/ui.md); validações, exibição e endereço em
[data-model.md](data-model.md).

## Pré-requisitos

API (porta 5193) e frontend rodando, com uma conta, categorias de despesa e de receita, uma despesa
parcelada e uma conta fixa (as duas divididas com uma pessoa criada nesta tela):

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

O JS inicial deve continuar perto de 338 kB (as duas páginas ficam em pacotes sob demanda).

## Cenários manuais

| # | Ação | Resultado esperado | Spec |
|---|---|---|---|
| 1 | Pessoas sem ninguém | estado vazio com "Nova pessoa" | US1-6 |
| 2 | Cadastrar "Esposa" e "Sogro" | lista em ordem alfabética, "Pessoa cadastrada." | US1-3 |
| 3 | Em Despesas, dividir a geladeira (10×) com o Sogro 100%; em Contas fixas, a internet com a Esposa 50% | cobranças aparecem nos extratos | — |
| 4 | Lista de pessoas | "Deve até agora" e "No mês" de cada um, total geral | US1-1 |
| 5 | "Pagamento" na Esposa pela lista | valor sugerido = devido no mês; salvar → saldo cai | US3-1, FR-015 |
| 6 | Extrato da Esposa no mês seguinte | saldo anterior = saldo final do mês atual | US2-2 |
| 7 | Pagamento escolhendo uma cobrança específica | a escolhida fica paga primeiro | US3-2 |
| 8 | Pagamento maior que o devido | saldo vira "crédito de R$ X" | US3-3, US2-3 |
| 9 | Cobrança avulsa "Usou o cartão" R$ 180,00 no Sogro; editar e remover | extrato reflete; avisos | US4 |
| 10 | Tocar na cobrança da geladeira no extrato | abre o detalhe em Despesas | US2-5 |
| 11 | Resumo geral do Sogro | "N de 10 vencidas", total, pago, falta; deve até hoje / no total | US5 |
| 12 | Editar e remover um pagamento | saldos recalculados | US6 |
| 13 | Em Receitas, tocar no reembolso da Esposa | abre o extrato dela no mês do reembolso | FR-010 |
| 14 | Remover a Esposa (com lançamentos) | mensagem da API no diálogo | US1-5 |
| 15 | Largura 360 px nas duas páginas | sem rolagem horizontal; painéis vindo de baixo | FR-014 |
