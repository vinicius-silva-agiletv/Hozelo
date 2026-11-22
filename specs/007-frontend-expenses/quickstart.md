# Quickstart: validar a Tela de Despesas

**Feature**: `007-frontend-expenses`

Contrato em [contracts/ui.md](contracts/ui.md); validações, endereço e prévias em
[data-model.md](data-model.md).

## Pré-requisitos

API (porta 5193) e frontend rodando, com uma conta, ao menos uma categoria de despesa (ex.: pelas
sugestões em Configurações) e, para a divisão, uma pessoa criada pela API (`POST /api/people`):

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

O JS inicial deve continuar perto de 337 kB (a tela de Despesas fica no próprio pacote, baixado sob
demanda).

## Cenários manuais

| # | Ação | Resultado esperado | Spec |
|---|---|---|---|
| 1 | Abrir Despesas sem despesas | estado vazio com "Nova despesa" | US1-5 |
| 2 | Nova despesa "Geladeira", 10×, total R$ 3.500,00, 1º venc. dia 10 do mês | resumo "10 × R$ 350,00 · última em …"; parcela 1/10 no mês | US3-1 |
| 3 | Nova despesa, modo parcela, 48 × R$ 1.000,00, 1º venc. 15/05/2023 | total R$ 48.000,00; sugere 42 pagas; "faltam 6" | US3-2, US3-4 |
| 4 | R$ 100,00 em 3× | resumo indica a sobra na última (R$ 33,34) | US3-3 |
| 5 | Ver dezembro e abrir "Nova despesa" | vencimento padrão no dia de hoje em dezembro | US3-7 |
| 6 | Marcar a parcela da geladeira como paga | caixa marcada; Pago e Em aberto mudam R$ 350,00 | US2-1 |
| 7 | Desfazer | volta ao que era | US2-2 |
| 8 | "Pagar em outra data" com data futura | mensagem; nada enviado | US2-3 |
| 9 | Filtrar por categoria e recarregar a página | filtro e mês mantidos | US1-3, US1-6 |
| 10 | Aba Todas, filtro "Em aberto" | despesas ordenadas pelo próximo vencimento, totais pago/restante | US4-1 |
| 11 | Abrir a do carro, Amortizar "as 6 últimas" com R$ 5.400,00 | prévia com desconto R$ 600,00; parcelas "amortizadas" | US5-1 |
| 12 | Ver o mês atual | as 6 parcelas aparecem como "antecipadas" | US5-4 |
| 13 | Editar a do carro | mensagem da API (tem parcelas amortizadas) | US4-4 |
| 14 | Editar a geladeira para 12× | parcelas recalculadas, pagas mantidas | US4-3 |
| 15 | Dividir uma despesa com a pessoa, 50% | "R$ 175,00 por parcela"; lista mostra "Pessoa · 50%" | US6-2 |
| 16 | Remover a geladeira | confirmação; some do mês e da lista | US4-5 |
| 17 | Largura 360 px | sem rolagem horizontal; formulários e detalhe vindo de baixo | FR-017 |
