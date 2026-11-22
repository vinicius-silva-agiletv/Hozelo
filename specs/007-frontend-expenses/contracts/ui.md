# UI Contract: Tela de Despesas

**Feature**: `007-frontend-expenses`

## Rota

| Caminho | Tela | Título da aba |
|---|---|---|
| `/despesas` | Despesas (substitui "em construção"; carregada sob demanda) | Despesas · Hozelo |

Parâmetros de endereço: `aba`, `mes`, `categoria`, `situacao`, `despesa` ([data-model.md](../data-model.md)).
Exemplo: `/despesas?aba=mes&mes=2026-12&categoria=4&despesa=17`.

## API consumida

| Chamada | Uso | Tratamento |
|---|---|---|
| `GET /api/installments?year=&month=[&categoryId=]` | visão do mês | erro → mensagem + "Tentar novamente" |
| `GET /api/expenses[?categoryId=][&status=Open\|Paid]` | visão Todas | idem |
| `GET /api/expenses/{id}` | detalhe | 404 → aviso, fecha o detalhe e atualiza as listas |
| `POST /api/expenses` | cadastrar | 201 → aviso; 400 → mensagens no formulário |
| `PUT /api/expenses/{id}` | editar | 200 (despesa) → aviso; 400/404 → mensagens no formulário |
| `DELETE /api/expenses/{id}` | remover | 204 → aviso; 404 → mensagem no diálogo |
| `POST /api/expenses/{id}/installments/{n}/payment` `{ paidOn? }` | marcar paga | 200 (despesa) → atualiza; erro → desfaz a marcação e mostra aviso de erro |
| `DELETE /api/expenses/{id}/installments/{n}/payment` | desfazer | idem |
| `POST /api/expenses/{id}/amortizations` | amortizar | 200 → aviso; 400 → mensagens no formulário |
| `GET /api/categories?type=Expense` | filtro e formulário | já usado pela 006 |
| `GET /api/people` | seletor de pessoa | vazio → opção explica a área Pessoas |

## Avisos de sucesso

| Ação | Aviso |
|---|---|
| Cadastrar | "Despesa cadastrada." |
| Editar | "Despesa atualizada." |
| Remover | "Despesa removida." |
| Marcar paga | "Parcela marcada como paga." |
| Desfazer | "Pagamento desfeito." |
| Amortizar | "Amortização registrada." |

## Textos fixos

| Onde | Texto |
|---|---|
| Totais do mês | "Total", "Pago", "Em aberto" |
| Totais Todas | "Pago", "Restante" (e "Desconto obtido" quando > 0) |
| Marcas | "antecipada" (paga antes do mês do vencimento), "amortizada" |
| Resumo do formulário | "10 × R$ 350,00 · última em 10/08/2027"; "42 pagas · faltam 6"; "a última parcela leva a sobra: R$ 33,34" |
| Resumo da amortização | "6 parcelas · R$ 6.000,00 · desconto de R$ 600,00" |
| Sem categorias | "Crie uma categoria de despesa antes de cadastrar." + link "Ir para Configurações" |
| Sem pessoas | "Cadastre pessoas na área Pessoas para dividir despesas." |
| Desfazer amortizada | "Esta parcela foi amortizada. Desfazer o pagamento remove o desconto correspondente." |

## Componentes (`src/features/expenses/components`)

| Componente | Responsabilidade |
|---|---|
| `MonthView` | seletor de mês, filtro, totais e lista de parcelas |
| `InstallmentRow` | caixa de pago, dados da parcela, menu "Pagar em outra data" |
| `AllExpensesView` | filtros, totais e cartões de despesa |
| `ExpenseFormDialog` | cadastrar/editar, com resumo e divisão com pessoa |
| `ExpenseDetailDialog` | detalhe com parcelas e ações |
| `AmortizeDialog` | amortização com prévia |
| `PayOnDateDialog` | pagamento com data escolhida |
| `DeleteExpenseDialog` | confirmação de remoção |

## Utilitários novos

| Nome | Onde |
|---|---|
| `todayIso`, `isAfterToday`, `lastDayOfMonth`, `addMonthsToDate` | `lib/date.ts` |
| prévias (R§5) | `features/expenses/preview.ts` |
| `usePeople` | `features/people/hooks.ts` |
