# Research: Reembolsos de Terceiros

**Feature**: `004-third-party-reimbursements` | **Date**: 2026-11-21

Decisões técnicas (Decision / Rationale / Alternatives). Reutiliza das features anteriores:
`InstallmentCalculator` (centavos, `DistributePayment`), `RecurrenceCalculator`, a regra de mês das
parcelas (002), `BalanceCalculator` e `GET /summaries` (003).

## 1. Pessoas

- **Decision**: tabela `people` (`EntityBase` + `user_id`, `name varchar(50)`), índice único
  `(user_id, lower(name))`, mesmo padrão das categorias (checagem no use case + índice no banco +
  conversão do `23505` em 409).
- **Alternatives considered**: reaproveitar `users` (pessoas não acessam o sistema; misturaria
  autenticação com cadastro).

## 2. Marcação de despesas e contas fixas

- **Decision**: colunas `person_id bigint NULL` (FK `RESTRICT`) e `person_percent smallint NULL`
  (1–100) em `expenses` e em `recurring_entries`; check
  `(person_id IS NULL) = (person_percent IS NULL)` e, em `recurring_entries`,
  `person_id IS NULL OR kind = 1` (só contas fixas). Os requests de despesa e de recorrência ganham
  `personId` e `personPercent` (padrão 100 quando há pessoa).
- **Rationale**: "no máximo uma pessoa por despesa/conta fixa" (Assumptions) cabe em duas colunas;
  a FK `RESTRICT` implementa FR-002 (pessoa marcada não pode ser removida).
- **Alternatives considered**: tabela de marcações N:N (preparada para divisão entre várias
  pessoas, que está fora de escopo); percentual decimal (sem necessidade real; inteiro evita
  arredondamentos estranhos).

## 3. Cobranças: calculadas ou gravadas?

- **Decision**: cobranças de **despesas e contas fixas marcadas são calculadas** a cada consulta a
  partir das parcelas/ocorrências; só as **cobranças avulsas são gravadas** (`person_charges`).
- **Rationale**: FR-006 e FR-021 exigem que as cobranças acompanhem qualquer mudança na despesa ou
  conta fixa (edição, recálculo, amortização, ajuste, pulo, encerramento) sem lançamento manual;
  calcular evita sincronização e dados duplicados (mesma escolha das ocorrências na 003).
- **Alternatives considered**: gravar cobranças e atualizá-las em cada use case de despesa e
  recorrência (muitos pontos de sincronização, risco de divergência).

## 4. Valor das cobranças (`ChargeCalculator`, Domain)

- **Decision**:
  - **despesa marcada**: valor efetivo de cada parcela = valor pago se paga, senão valor da parcela
    (o desconto de amortização também é da pessoa). Parte da pessoa no total =
    `round(Σ efetivos × percentual / 100, 2)`, distribuída entre as parcelas com
    `InstallmentCalculator.DistributePayment` (maior resto) → soma exata (SC-005); 100% = valores
    iguais aos das parcelas. Mês e data pela regra da 002 (antecipada → data do pagamento).
  - **conta fixa marcada**: cada ocorrência gera `round(valor da ocorrência × percentual / 100, 2)`
    no mês dela (ajustes e pulos já vêm do `RecurrenceCalculator`).
  - **avulsa**: valor e data gravados.
- Cada cobrança tem uma **chave estável** em texto, usada para escolher cobranças nos pagamentos:
  `Installment:{idDaParcela}`, `Recurrence:{idDaRecorrência}:{yyyy-MM}`, `Manual:{idDaCobrança}`.
  O id da parcela é estável porque o recálculo da 002 atualiza parcelas no lugar.

## 5. Pagamentos e escolha de cobranças

- **Decision**: `person_payments` (valor, data, observação) e `person_payment_targets`
  (`payment_id` FK cascade, `charge_key varchar(80)`, `position`). Na gravação, o use case valida
  que cada chave escolhida existe, é da pessoa e não está totalmente paga (pelo estado calculado
  sem o próprio pagamento).
- **Rationale**: as cobranças calculadas não têm linha própria; a chave em texto referencia
  qualquer origem de forma uniforme.

## 6. Abatimento (`PaymentAllocator`, Domain, puro)

- **Decision**: cobranças ordenadas por (data, chave); pagamentos aplicados em ordem de
  (data, id). Para cada pagamento: (1) abate as cobranças escolhidas que ainda existem, em ordem
  cronológica, até o valor em aberto de cada uma; (2) a sobra abate as cobranças em aberto da mais
  antiga para a mais nova, **incluindo cobranças futuras** (é assim que o crédito "abate as
  cobranças seguintes"); (3) o que sobrar fica como crédito não alocado. Chave escolhida que deixou
  de existir é ignorada (a parte vai para o passo 2), sem ação da família.
- Resultado por cobrança: pago, falta, situação (`Paid` / `Partial` / `Open`) e pagamentos que a
  abateram.
- **Rationale**: FR-012/FR-022; função pura e determinística, testada à parte.

## 7. Extrato e saldo (`PersonStatementCalculator`, Domain)

- **Decision**: saldos não dependem do abatimento:
  `saldoAnterior(M) = Σ cobranças com mês < M − Σ pagamentos com mês < M`;
  `saldoFinal(M) = saldoAnterior(M) + cobranças(M) − pagamentos(M)`. "Deve até hoje" =
  cobranças com mês ≤ atual − todos os pagamentos com data ≤ hoje; "deve no total" = todas as
  cobranças conhecidas − todos os pagamentos.
- **Contas fixas sem mês final**: cobranças geradas só até o mês consultado (extrato) ou até o mês
  atual (resumo e totais), evitando séries infinitas (FR-023).
- **Rationale**: FR-010/FR-011 e SC-002 por construção.

## 8. Resumo por origem (FR-023)

- **Decision**: agrupar cobranças por origem (`Expense:{id}`, `Recurrence:{id}`, `Manual:{id}`):
  descrição, vencidas (mês ≤ atual) / total de cobranças, total, pago (soma do abatimento), falta.

## 9. Reembolsos no resumo da família (FR-014, FR-018–FR-020)

- **Decision**: o `GetMonthlySummaryUseCase` (003) passa a gerar, para cada pessoa:
  - um `LedgerEntry` por **cobrança** (entrada prevista: `Amount` = valor, não liquidada);
  - um `LedgerEntry` por **pagamento** (`Amount = 0`, `SettledAmount` = valor, liquidado na data);
  ambos com `Source = Reimbursement` e a nova marca `PendingExempt = true`, para que o
  `BalanceCalculator.Pending` não os trate como pendências item a item.
  - **Pendência a receber** do mês atual: por pessoa, o saldo líquido ao fim do mês anterior (todo
    o histórico; crédito subtrai), passado ao `BalanceCalculator.Accumulated` num novo parâmetro
    `extraPending` e listado em `pending.items` (um item por pessoa com saldo ≠ 0).
  - Na resposta, as entradas de reembolso são agregadas em **um item por pessoa** no mês
    (`amount` = cobranças, novo campo `settledAmount` = pagamentos); `category` é `null`.
  - Com filtro de categoria, reembolsos não entram (FR-020).
- **Por que fecha a conta (SC-007)**: no mês atual, um pagamento de dívida antiga reduz o saldo da
  pessoa em `X` (pendência −X) e entra no realizado; como o mês atual conta o **previsto**
  (cobranças, não pagamentos), o acumulado ao fim do mês não muda.
- **Alternatives considered**: tratar reembolso como receita avulsa gerada (duplicaria dados e
  quebraria a regra de saldo que passa adiante).

## 10. Endpoints

- `/people` (CRUD + saldos na listagem), `/people/{id}/charges` (avulsas),
  `/people/{id}/payments`, `/people/{id}/statement?year=&month=`, `/people/{id}/summary`.
- Despesas (`/expenses`) e recorrências (`/recurrences`) aceitam `personId`/`personPercent` e
  devolvem `person`.

## 11. Testes

- `Domain.Tests`: `ChargeCalculator` (percentual com soma exata, amortização, antecipada, conta fixa
  com ajuste/pulo), `PaymentAllocator` (todas as regras de §6), `PersonStatementCalculator`
  (encadeamento de saldos, crédito), e o `BalanceCalculator` com `PendingExempt`/`extraPending`.
- Validators, use cases e `WebApi.Tests` para todos os endpoints e para o cenário de SC-007 no
  resumo da família.
