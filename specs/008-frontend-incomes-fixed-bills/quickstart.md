# Quickstart: validar as telas de Receitas e Contas Fixas

**Feature**: `008-frontend-incomes-fixed-bills`

Contrato em [contracts/ui.md](contracts/ui.md); validações, derivações e endereço em
[data-model.md](data-model.md).

## Pré-requisitos

API (porta 5193) e frontend rodando, com uma conta, categorias de receita (Salário, 13º salário,
Vendas) e de despesa (Moradia, Internet, Luz), e uma pessoa criada pela API (`POST /api/people`):

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

O JS inicial deve continuar perto de 337 kB (cada tela fica no próprio pacote sob demanda).

## Cenários manuais

| # | Ação | Resultado esperado | Spec |
|---|---|---|---|
| 1 | Receitas sem nada | estado vazio com "Nova receita" | US1-5 |
| 2 | Nova receita "Todo mês": Salário R$ 6.000,00, dia 5, início no mês atual | aparece no mês e no seguinte, marca "recorrente" | US3-3, US1-2 |
| 3 | Nova receita avulsa: 13º R$ 3.000,00 no dia 20 | aparece só no mês; totais Previsto R$ 9.000,00 | US3-1, US1-1 |
| 4 | Marcar o salário como recebido | só este mês recebido; Recebido R$ 6.000,00 | US2-2 |
| 5 | "Receber com outro valor" no salário do mês seguinte (R$ 6.200,00) | mês seguinte ajustado e recebido | FR-003 |
| 6 | Nova conta fixa: Luz R$ 250,00, dia 15 | aparece em Contas fixas | US4-4 |
| 7 | "Pagar com outro valor" na Luz: R$ 310,00 | mês ajustado ("normal R$ 250,00") e pago; mês seguinte R$ 250,00 | US4-3 |
| 8 | "Pular este mês" numa conta e depois "Desfazer ajuste" | "pulada" e fora dos totais; depois volta | US5-2 |
| 9 | "Mudar valor" da Internet para R$ 135,00 a partir de 2 meses à frente | meses anteriores mantêm o valor; histórico no detalhe | US5-3 |
| 10 | "Encerrar" uma conta no mês atual | some do mês seguinte e aparece em "Encerradas"; "Reabrir" volta | US4-5, US5-4 |
| 11 | Dividir a Internet com a pessoa (50%) | "Pessoa · 50%" na lista e no detalhe | US7-1 |
| 12 | Editar e remover a avulsa | lista atualiza; aviso de remoção | US6 |
| 13 | Com um reembolso registrado pela API (pagamento de pessoa) | aparece em Receitas como "reembolso", sem caixa | Clarify Q1 |
| 14 | Largura 360 px nas duas telas | sem rolagem horizontal; painéis vindo de baixo | FR-016 |
