# UI Contract: Tela de Resumo do Mês

**Feature**: `010-frontend-monthly-summary`

## Rota

| Caminho | Tela | Título da aba |
|---|---|---|
| `/?mes=&categoria=&lista=` | Resumo do mês (substitui "em construção"; sob demanda) | Resumo do mês · Hozelo |

## API consumida

| Chamada | Uso | Tratamento |
|---|---|---|
| `GET /api/summaries?year=&month=[&categoryId=]` | totais, itens, pendências, acumulado | erro → mensagem + "Tentar novamente" |
| `POST/DELETE /api/expenses/{id}/installments/{n}/payment` | pagar/desfazer parcela | erro → caixa volta e aviso de erro |
| `POST/DELETE /api/incomes/{id}/receipt` | receber/desfazer receita avulsa | idem |
| `POST/DELETE /api/recurrences/{id}/months/{y}/{m}/settlement` | quitar/desfazer ocorrência | idem |
| `GET /api/categories?type=Expense` e `?type=Income` | filtro | já usado |

## Avisos

| Ação | Aviso |
|---|---|
| Pagar / desfazer (saída) | "Marcado como pago." / "Pagamento desfeito." |
| Receber / desfazer (entrada) | "Marcado como recebido." / "Recebimento desfeito." |

## Textos fixos

| Onde | Texto |
|---|---|
| Destaque com acumulado | "Saldo no fim do mês", "veio de {mês anterior}", "saldo do mês", "projeção de fechamento" / "fechamento realizado" |
| Destaque sem acumulado | "Saldo previsto do mês" + motivo: "Informe o saldo inicial para ver quanto vai sobrar no fim do mês." (link "Informar saldo inicial" → `/configuracoes`) · "O saldo acumulado vale só para a família inteira (sem filtro de categoria)." · "O acompanhamento do saldo começa no mês do saldo inicial." |
| Cartões | "Previsto": "Entradas", "Saídas", "Saldo" · "Realizado": "Recebido", "Pago", "Saldo" |
| Pendências | "Pendências de meses anteriores", "A pagar", "A receber", item: "{nome} · {mês de origem}" |
| Abas | "Entradas", "Saídas" |
| Marcas | "antecipada", "reembolso" |
| Mês vazio | "Nada lançado neste mês" + links "Ir para Despesas" e "Ir para Receitas" |

## Componentes (`src/features/summary/components`)

| Componente | Responsabilidade |
|---|---|
| `SummaryHero` | destaque principal (R§3) |
| `SummaryTotals` | cartões previsto e realizado |
| `PendingSection` | pendências de meses anteriores |
| `LedgerList` | lista de entradas ou saídas |
| `LedgerRow` / `LedgerToggle` | item com link e caixa de pago/recebido por tipo (R§4) |
| `SummaryCategoryFilter` | filtro com grupos Despesas/Receitas |
