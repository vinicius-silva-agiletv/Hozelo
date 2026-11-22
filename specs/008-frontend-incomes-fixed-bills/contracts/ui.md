# UI Contract: Telas de Receitas e Contas Fixas

**Feature**: `008-frontend-incomes-fixed-bills`

## Rotas

| Caminho | Tela | Título da aba |
|---|---|---|
| `/receitas` | Receitas (substitui "em construção"; sob demanda) | Receitas · Hozelo |
| `/contas-fixas` | Contas fixas (substitui "em construção"; sob demanda) | Contas fixas · Hozelo |

Parâmetros: [data-model.md](../data-model.md) "Estado no endereço". Ex.: `/contas-fixas?mes=2026-12&recorrencia=4`.

## API consumida

| Chamada | Uso | Resposta / tratamento |
|---|---|---|
| `GET /api/summaries?year=&month=[&categoryId=]` | itens e totais do mês | erro → mensagem + "Tentar novamente" |
| `GET /api/incomes/{id}` | detalhe da avulsa | 404 → aviso e fecha |
| `POST /api/incomes` | cadastrar avulsa | 201 → aviso; 400 → formulário |
| `PUT /api/incomes/{id}` | editar avulsa | 200 → aviso; 400/404 → formulário |
| `DELETE /api/incomes/{id}` | remover avulsa | 204 → aviso; erro no diálogo |
| `POST/DELETE /api/incomes/{id}/receipt` | receber / desfazer | 200 → atualiza; erro → desfaz a caixa e mostra aviso |
| `GET /api/recurrences?kind=Expense\|Income` | contas fixas (todas) | erro → mensagem + "Tentar novamente" |
| `GET /api/recurrences/{id}` | detalhe, meses e histórico | 404 → aviso e fecha |
| `POST /api/recurrences` | cadastrar recorrente / conta fixa | 201 → aviso; 400 → formulário |
| `PUT /api/recurrences/{id}` | editar dados | 200 → aviso |
| `DELETE /api/recurrences/{id}` | remover | 204 → aviso; erro no diálogo |
| `PUT /api/recurrences/{id}/amount` `{ amount, fromMonth }` | mudar valor | 200 → aviso |
| `PUT /api/recurrences/{id}/end` `{ endMonth }` · `DELETE …/end` | encerrar · reabrir | 200 → aviso |
| `PUT /api/recurrences/{id}/months/{y}/{m}` `{ amount?, skipped }` · `DELETE` | ajustar/pular · desfazer ajuste | 200 → aviso |
| `POST/DELETE /api/recurrences/{id}/months/{y}/{m}/settlement` `{ settledOn? }` | quitar / desfazer | 200 → atualiza; erro → desfaz a caixa |
| `GET /api/categories?type=Income\|Expense` | filtros e formulários | já usado |
| `GET /api/people` | seletor de pessoa (contas fixas) | já usado |

## Avisos de sucesso

| Ação | Aviso |
|---|---|
| Cadastrar avulsa / recorrente / conta fixa | "Receita cadastrada." / "Receita recorrente cadastrada." / "Conta fixa cadastrada." |
| Editar avulsa / recorrência | "Receita atualizada." / "Recorrência atualizada." |
| Remover avulsa / recorrência | "Receita removida." / "Recorrência removida." |
| Receber / desfazer | "Receita marcada como recebida." / "Recebimento desfeito." |
| Pagar / desfazer (conta fixa) | "Conta marcada como paga." / "Pagamento desfeito." |
| Ajustar mês / pular / desfazer ajuste | "Valor do mês ajustado." / "Mês pulado." / "Ajuste desfeito." |
| Mudar valor / encerrar / reabrir | "Valor alterado." / "Recorrência encerrada." / "Recorrência reaberta." |

## Textos fixos

| Onde | Texto |
|---|---|
| Totais Receitas | "Previsto", "Recebido", "A receber" |
| Totais Contas fixas | "Previsto", "Pago", "A pagar" |
| Marcas | "recorrente", "reembolso", "pulada", "ajustado (normal R$ X)", "encerrada em mês/ano" |
| Linha de conta fixa | "dia 10" |
| Seção | "Encerradas" |
| Menu da ocorrência | "Pagar com outro valor" / "Receber com outro valor", "Pagar em outra data" / "Receber em outra data", "Ajustar este mês", "Pular este mês", "Desfazer ajuste" |
| Menu da recorrência (detalhe) | "Editar", "Mudar valor", "Encerrar", "Reabrir", "Remover" |
| Sem categorias | "Crie uma categoria de receita (ou de despesa) antes de cadastrar." + "Ir para Configurações" |

## Componentes

| Componente | Onde | Responsabilidade |
|---|---|---|
| `IncomesPage`, `IncomeMonthList`, `IncomeFormDialog`, `IncomeDetailDialog` | `features/incomes` | tela de Receitas e avulsas |
| `FixedBillsPage`, `FixedBillMonthList`, `EndedFixedBills` | `features/fixed-bills` | tela de Contas fixas |
| `RecurrenceFormDialog`, `RecurrenceDetailDialog`, `OccurrenceMenu`, `AdjustMonthDialog`, `SettleWithAmountDialog`, `SettleOnDateDialog`, `ChangeAmountDialog`, `EndRecurrenceDialog`, `DeleteRecurrenceDialog` | `features/recurrences` | recorrência e ajustes (as duas telas) |
| `OptionGroup`, `PaymentToggle` (genérico), `PersonSplitFields` | `components/shared` | movidos da 007 para uso nas três telas |
| `useMonthUrl` | `lib/use-month-url.ts` | estado no endereço (generalizado da 007) |
