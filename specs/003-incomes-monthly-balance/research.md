# Research: Receitas e Saldo Mensal

**Feature**: `003-incomes-monthly-balance` | **Date**: 2026-11-21

Decisões técnicas que a spec deixou para o plano (Decision / Rationale / Alternatives). Reutiliza
a fundação das features 001 e 002: autenticação, exceções 400/404/409, `ICalendar`,
`InstallmentCalculator` (centavos e dias 29–31), FluentMigrator e Testcontainers.

## 1. Tipo da categoria

- **Decision**: coluna `type smallint NOT NULL DEFAULT 1` em `categories` (`Expense = 1`,
  `Income = 2`). A migration troca o índice `ux_categories_user_name` por
  `ux_categories_user_type_name` em `(user_id, type, lower(name))`. Categorias existentes recebem
  `Expense` pelo default (FR-002). No POST, `type` é opcional e assume `Expense`, mantendo o
  contrato da 002 compatível; no PUT, informar um tipo diferente do atual é recusado (FR-006).
- **Rationale**: uma tabela só mantém o CRUD da 002 e a contagem de lançamentos; o default faz a
  migração sem perder nada (SC-006).
- **Alternatives considered**: tabelas separadas de categorias de receita (duplica CRUD e
  validações); categoria sem tipo (rejeitado no clarify).

## 2. Receita avulsa

- **Decision**: tabela própria `incomes` (nome, categoria, valor, `expected_date`, `received_on`
  nulo, observação). O mês de referência é sempre o de `expected_date` (Assumptions da spec).
- **Rationale**: é o espelho de uma despesa à vista, mas com "recebida" em vez de "paga" e sem
  parcelas; reaproveitar `expenses` misturaria sinais e regras de amortização.
- **Alternatives considered**: tabela única `transactions` com sinal (mais genérica, mas
  obrigaria reescrever a 002).

## 3. Recorrência (receitas e contas fixas)

- **Decision**: uma única estrutura para os dois tipos, com `kind` (`Expense = 1`, `Income = 2`):
  - `recurring_entries`: nome, categoria, `kind`, `day_of_month` (1–31), `start_month` e
    `end_month` (datas no dia 1), observação;
  - `recurring_entry_amounts`: histórico de valores, cada um com `effective_month`
    (valor dali em diante = nova linha);
  - `recurring_entry_months`: registro por mês, criado só quando há algo no mês:
    `amount` ajustado (nulo = segue a regra), `skipped`, `settled_on` (recebida/paga).
  A ocorrência **não é gravada**: é calculada por `RecurrenceCalculator` (Domain) a partir das três
  tabelas.
- **Rationale**: FR-026 pede exatamente as mesmas regras para receitas e contas fixas; ocorrência
  calculada evita gerar linhas para meses futuros sem fim e mantém "sem data final" trivial.
- **Alternatives considered**: gerar uma linha por mês até X anos à frente (job de geração,
  limite arbitrário, edições em massa); duas estruturas separadas (código duplicado).

## 4. Cálculo da ocorrência

- **Decision**: para o mês `M` (dia 1):
  1. fora de `[start_month, end_month]` → sem ocorrência;
  2. registro do mês com `skipped` → sem ocorrência;
  3. valor = `amount` do registro do mês, senão o valor do histórico com o maior
     `effective_month ≤ M`;
  4. data = `day_of_month` limitado ao último dia do mês (mesma regra de
     `InstallmentCalculator.DueDate`);
  5. situação = `settled_on` do registro do mês (nulo = prevista/a pagar).
- **Rationale**: regra determinística e pura, testável em `Domain.Tests`.

## 5. Regras de edição da recorrência

- **Decision** (validadas no use case, mensagens em data-model.md):
  - **valor dali em diante a partir de `M`**: insere/atualiza a linha de histórico em `M` e mantém
    as linhas posteriores ("vale até a próxima mudança"); antes, **congela** cada mês `≥ M` já
    liquidado e sem ajuste, gravando o valor antigo no registro do mês (SC-003 e edge case "não
    altera ocorrências já recebidas");
  - **ajustar mês**: só dentro do período; **pular mês**: recusado se o mês estiver liquidado;
    **desfazer ajuste**: limpa `amount` e `skipped`, mantendo `settled_on`; o registro é apagado
    se ficar vazio;
  - **encerrar em `E`**: recusado se `E < start_month` ou se houver mês liquidado depois de `E`;
    **reabrir**: `end_month = null`;
  - **editar** nome/categoria/dia/observação vale para todos os meses (as datas de liquidação já
    gravadas não mudam); categoria precisa ser do tipo do `kind`;
  - **remover**: apaga tudo em cascata.

## 6. Saldo inicial

- **Decision**: tabela `opening_balances` com `user_id` único, `amount numeric(12,2)` (aceita
  negativo) e `reference_date date`. `GET`/`PUT /opening-balance` (recurso único por conta;
  exceção justificada à regra de rotas no plural).
- **Rationale**: FR-022 (um único valor por conta); separado de `users` para não misturar
  autenticação com finanças.

## 7. Lançamentos do mês ("razão mensal")

- **Decision**: a Application monta uma lista neutra de lançamentos (`LedgerEntry`: mês de
  referência, data, direção entrada/saída, valor previsto, valor liquidado, liquidado?, origem)
  a partir de:
  - **parcelas** (feature 002): mês de referência pela regra da 002 (antecipada → mês do
    pagamento; senão → mês do vencimento); valor previsto = valor pago se paga, senão valor da
    parcela (mesmo `totalAmount` da visão mensal da 002, FR-018);
  - **receitas avulsas**: mês de `expected_date`;
  - **ocorrências de recorrências** dos dois tipos.
  O cálculo de totais, saldo e acumulado é feito por `BalanceCalculator` (Domain), puro.
- **Rationale**: um só lugar para as regras de dinheiro do saldo (SC-002, SC-008); fácil de testar
  sem banco.

## 8. Saldo do mês, acumulado e pendências

- **Decision** (`BalanceCalculator`):
  - **previsto** do mês = Σ entradas previstas − Σ saídas previstas;
  - **realizado** do mês = Σ recebido − Σ pago (só itens liquidados do mês);
  - **contribuição do mês para o acumulado**: mês `< atual` → realizado; mês `≥ atual` →
    previsto (FR-024);
  - **pendências** (só no mês atual): itens não liquidados de meses `≥` mês do saldo inicial e
    `<` mês atual, somados ao previsto do mês atual em linha separada (FR-029);
  - **mês do saldo inicial**: só itens com data `≥ reference_date`; meses anteriores não têm
    acumulado;
  - **saldo anterior(M)** = saldo inicial + Σ contribuições dos meses de `início` até `M − 1`
    (+ pendências, se `M − 1 ≥ atual`); **acumulado(M)** = saldo anterior + contribuição de `M`
    (+ pendências, se `M` = atual);
  - com filtro de categoria, o acumulado e as pendências não são calculados (FR-017).
- **Rationale**: regra única, sem duplicidade: quando uma pendência é liquidada ela sai das
  pendências e entra no realizado do seu mês, e o acumulado não muda (cenário US3-15).
- **Performance**: o acumulado de `M` precisa dos lançamentos desde o mês do saldo inicial. Uma
  consulta por fonte para o intervalo inteiro e agrupamento em memória; com a escala familiar
  (décadas = centenas de meses, milhares de parcelas) fica bem abaixo de 500 ms.

## 9. Consulta de parcelas por intervalo

- **Decision**: generalizar `IInstallmentReadOnlyRepository` com `GetByRange(start, end)`, usando a
  mesma condição da 002 com `[start, end)` (vence no intervalo e não foi paga antes dele, ou foi
  paga no intervalo antes do mês de vencimento); `GetByMonth` passa a chamar `GetByRange`. O mês de
  referência de cada parcela é calculado em memória.
- **Rationale**: a condição da 002 já funciona para intervalos e evita duplicar regras.

## 10. Endpoints e compatibilidade

- **Decision**: `GET /installments` (002) continua igual (FR-018). O resumo completo fica em
  `GET /summaries?year=&month=&categoryId=`. Contas fixas e receitas recorrentes compartilham
  `/recurrences` (campo `kind`). Meses na API em texto `"yyyy-MM"`; nas rotas, `{year}/{month}`.
- **Mudança na 002**: `ResponseCategoryJson.expensesCount` vira `entriesCount` (despesas,
  receitas e recorrências da categoria); os testes da 002 são ajustados. Não há frontend, então
  não há cliente quebrado.
- **Alternatives considered**: estender `GET /installments` (misturaria contratos e quebraria a
  002); manter `expensesCount` com outro significado (confuso).

## 11. Testes

- **Decision**: `Domain.Tests` para `RecurrenceCalculator` e `BalanceCalculator` (todas as regras
  de ocorrência, acumulado, pendências e saldo inicial, com casos de borda); validators e use
  cases como na 002; `WebApi.Tests` para cada endpoint e para o cenário completo do acumulado com
  PostgreSQL real, controlando "hoje" com `FakeTimeProvider`.
