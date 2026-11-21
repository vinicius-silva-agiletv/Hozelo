# Research: Despesas e Categorias

**Feature**: `002-expenses-categories` | **Date**: 2026-11-21

Decisões técnicas que a spec deixou para o plano. Cada item segue o padrão
Decision / Rationale / Alternatives considered. A fundação da feature 001 (filtro de
autenticação, exceções, FluentMigrator, Testcontainers) é reutilizada sem mudanças.

## 1. Representação de dinheiro

- **Decision**: `decimal` no C# e `numeric(12,2)` no PostgreSQL (até R$ 9.999.999.999,99).
  Validação recusa valores com mais de 2 casas decimais (`value == Math.Round(value, 2)`).
  Todo cálculo de divisão é feito em centavos inteiros (`long`) e convertido de volta.
- **Rationale**: exigido pela constitution (princípio IV); centavos inteiros eliminam erros de
  arredondamento na divisão (FR-008, FR-017, SC-003).
- **Alternatives considered**: `double` (vetado: impreciso); guardar centavos como `bigint`
  no banco (seguro, mas pior de ler nas consultas manuais pela extensão do VS Code).

## 2. Datas de vencimento e de pagamento

- **Decision**: `DateOnly` no C# e `date` no PostgreSQL para vencimento, data da primeira
  parcela e data de pagamento. "Hoje" vem de um serviço `ICalendar.Today()` (Domain) que usa
  `TimeProvider` + fuso configurável `Settings:Calendar:TimeZoneId` (padrão
  `America/Sao_Paulo`). `created_on` continua `timestamptz` em UTC.
- **Rationale**: vencimento é uma data de calendário, não um instante; sem o fuso, um
  pagamento marcado às 22h em Brasília cairia no dia seguinte (UTC). O `TimeProvider` mantém os
  testes determinísticos (`FakeTimeProvider`).
- **Alternatives considered**: `timestamptz` para tudo (exige escolher hora fictícia e
  converte de forma errada perto da meia-noite); `DateTime.Today` (depende do fuso do servidor).

## 3. Divisão das parcelas e calendário

- **Decision**: cálculo puro no Domain (`InstallmentCalculator`), sem dependências:
  - modo **Total**: `centavosParcela = total / n` (divisão inteira); as `n-1` primeiras recebem
    esse valor e a última recebe `total - (n-1) * centavosParcela`;
  - modo **Installment**: todas as parcelas iguais ao valor informado; `total = parcela * n`;
  - vencimento `i` (0-based) = `primeira.AddMonths(i)` usando o **dia da primeira parcela**
    como âncora, limitado ao último dia do mês (`Math.Min(dia, DaysInMonth)`), para que
    31/01 → 28/02 → 31/03 (e não 28/03).
- **Rationale**: atende FR-007, FR-008 e o edge case dos dias 29–31; função pura é fácil de
  testar exaustivamente.
- **Alternatives considered**: `DateOnly.AddMonths` encadeado mês a mês (perde o dia 31 depois
  de fevereiro); distribuir a sobra nas primeiras parcelas (a spec pede na última).

## 4. Distribuição do valor de uma amortização

- **Decision**: o valor pago é repartido entre as parcelas escolhidas proporcionalmente ao
  valor de cada uma, em centavos, pelo método do maior resto (Hamilton): cada parcela recebe o
  piso da sua cota e os centavos restantes vão, um a um, para as maiores frações; empate
  resolvido pelo maior número de parcela. Desconto da parcela = valor − valor pago.
- **Rationale**: FR-019 exige soma exata e proporcionalidade; o maior resto garante as duas
  coisas e nenhum valor pago maior que o valor da parcela (já que o total pago ≤ soma).
- **Alternatives considered**: dividir igualmente (distorce quando a última parcela tem
  centavos a mais); guardar o desconto só na despesa (a visão mensal precisa do valor pago por
  parcela).

## 5. Valores calculados: guardar ou calcular?

- **Decision**: nada de totais guardados. A despesa guarda só o que foi informado; as parcelas
  guardam valor e pagamento. Pagas, faltantes, pago, desconto, restante, situação, próximo
  vencimento e data da última parcela são calculados na Application a partir das parcelas
  carregadas (método `ExpenseSummary.From(expense)`).
- **Rationale**: SC-002 (sempre consistente) sem risco de totais desatualizados; o volume é
  pequeno (uma família, poucas centenas de despesas, parcelas em milhares).
- **Alternatives considered**: colunas de totais atualizadas a cada operação (duplicação e
  risco de inconsistência); views/agregações em SQL (otimização prematura; reavaliar se a
  lista ficar lenta).

## 6. Dono dos dados

- **Decision**: `categories` e `expenses` têm `user_id` (FK para `users`); toda consulta e
  alteração filtra pelo usuário autenticado (`ILoggedUser`). Registro de outro usuário é tratado
  como inexistente (404).
- **Rationale**: a spec da 001 diz que a conta "será a dona de todos os dados financeiros";
  custo baixo hoje e evita migração se um dia houver mais de uma conta.
- **Alternatives considered**: tabelas sem dono (mais simples, mas acopla o modelo à regra de
  conta única).

## 7. Identificadores expostos na API

- **Decision**: expor o `id` (`bigint`) de categorias e despesas nas rotas; parcelas são
  endereçadas por `expenseId` + `number`.
- **Rationale**: o filtro por dono impede acesso a dados de terceiros, e só existe uma conta;
  um identificador público extra (Guid/Hashids, como no MyRecipeBook) não traz benefício real
  agora (princípio V).
- **Alternatives considered**: Guid público por entidade; Hashids.

## 8. Unicidade do nome da categoria

- **Decision**: nome salvo com `Trim()`; índice único `ux_categories_user_name` sobre
  `(user_id, lower(name))`. O use case verifica antes (mensagem amigável) e o `UnitOfWork`
  converte a violação `23505` desse índice em `ConflictException` (corrida).
- **Rationale**: mesma estratégia comprovada na 001 (checagem + garantia no banco).
- **Alternatives considered**: tipo `citext` (exige extensão no PostgreSQL).

## 9. Remoção de categoria com despesas

- **Decision**: FK `expenses.category_id` com `ON DELETE RESTRICT`; o use case conta as
  despesas e lança `ConflictException` (409) com a mensagem da spec. A remoção da categoria é
  física (`DELETE`), não `active = false`.
- **Rationale**: FR-003 e SC-006 garantidos no banco; categoria sem despesas não tem histórico
  a preservar.
- **Alternatives considered**: soft delete (deixaria nomes "fantasmas" bloqueando a
  unicidade).

## 10. Remoção de despesa

- **Decision**: remoção física; `expense_installments.expense_id` com `ON DELETE CASCADE`.
- **Rationale**: a spec define remoção definitiva sem lixeira (Assumptions).

## 11. Edição com recálculo (FR-013)

- **Decision**: se valor, modo do valor, quantidade ou data da primeira parcela mudarem:
  1. recusa (400) se houver parcela paga por amortização;
  2. recusa (400) se a nova quantidade for menor que N (parcelas pagas);
  3. gera o novo cronograma e marca como pagas as N primeiras, reaproveitando as datas de
     pagamento antigas em ordem cronológica; valor pago = valor da nova parcela.
  Mudanças só em nome, categoria ou observação não tocam nas parcelas.
- **Rationale**: regra da spec; reaproveitar datas mantém a visão mensal do histórico.

## 12. Visão mensal (FR-018)

- **Decision**: uma parcela pertence ao mês M = [início, fim) quando:
  `(due_date ∈ M e não (paid_on < início))` **ou** `(paid_on ∈ M e due_date ≥ fim)`.
  Ou seja, pagamento antecipado aparece no mês em que foi feito; pagamento em dia ou atrasado
  aparece no mês do vencimento. Consulta via EF Core com `Include` da despesa e categoria.
  Valor exibido = valor pago (se paga) ou valor da parcela (se em aberto).
  Totais: total = soma exibida; pago = soma dos valores pagos; em aberto = soma das em aberto.
- **Rationale**: atende US3-7/8/9 e US4-4 sem duplicar parcelas entre meses.

## 13. Exceções e status HTTP novos

| Exceção | HTTP | Uso |
|---|---|---|
| `NotFoundException(message)` | 404 | categoria, despesa ou parcela inexistente (ou de outro dono) |
| `ConflictException(message)` | 409 | nome de categoria repetido; categoria com despesas |
| `ErrorOnValidationException` (já existe) | 400 | entrada inválida e regras de negócio de edição/amortização |

## 14. Testes

- **Decision**: novo projeto `Domain.Tests` para o `InstallmentCalculator` e as regras das
  entidades (cálculo puro, muitos casos com `[Theory]`). Demais testes nos projetos existentes:
  validators em `Validators.Tests`, use cases em `UseCases.Tests` (repositórios fake),
  endpoints em `WebApi.Tests` (Testcontainers, PostgreSQL real — necessário para índice de
  expressão, FKs e consulta da visão mensal).
- **Rationale**: a regra de dinheiro é o ponto de maior risco da feature (SC-002, SC-003) e
  merece testes isolados; separar do `UseCases.Tests` deixa claro o que é regra de domínio.
- **Alternatives considered**: colocar os testes de cálculo em `UseCases.Tests` (mistura
  camadas).
