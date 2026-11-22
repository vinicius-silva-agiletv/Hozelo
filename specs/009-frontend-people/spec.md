# Feature Specification: Tela de Pessoas

**Feature Branch**: `009-frontend-people`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Tela de Pessoas do frontend (/pessoas). Lista de pessoas com quanto cada
uma deve até agora e quanto vence no mês, com cadastrar, renomear e remover (a API recusa remover
quem tem cobranças ou pagamentos). Detalhe da pessoa: resumo por origem (despesas divididas, contas
fixas, cobranças avulsas) e extrato mês a mês com o saldo que passa de um mês para o outro.
Cobranças avulsas: lançar um valor que a pessoa deve fora das despesas, editar e remover.
Pagamentos: registrar quanto a pessoa pagou (inclusive parcial, abatendo do que ela deve), editar e
remover; o que for pago aparece como reembolso em Receitas."

## Clarifications

### Session 2026-11-21

- Q: O detalhe da pessoa abre numa página própria ou num painel sobre a lista? → A: Página própria
  (`/pessoas/{id}`), com as abas Extrato do mês e Resumo geral, mês e aba no endereço e botão de
  voltar para a lista; formulários de pagamento e cobrança continuam em painel.
- Q: Dá para registrar um pagamento direto da lista de pessoas? → A: Sim; cada pessoa na lista tem a
  ação "Pagamento", que abre o mesmo formulário do detalhe (com o valor devido no mês sugerido).

## Visão geral

A área **Pessoas** (hoje "em construção") passa a mostrar quem deve dinheiro à família e por quê —
a esposa que paga parte da fatura, o sogro que usou o cartão — substituindo a aba de "quem me deve"
da planilha. As cobranças nascem sozinhas das despesas e contas fixas divididas (features 007 e
008) e de lançamentos avulsos; os pagamentos abatem o que a pessoa deve, e o que não foi pago passa
para o mês seguinte.

```text
Pessoas                                           [+ Nova pessoa]
┌──────────────────────────────────────────────────────────────┐
│ Esposa        deve até agora R$ 1.240,00 · no mês R$ 620,00 › │
│ Sogro         deve até agora R$ 3.500,00 · no mês R$ 350,00 › │
└──────────────────────────────────────────────────────────────┘

Esposa                       [+ Pagamento]  [+ Cobrança avulsa]
[ Extrato do mês | Resumo geral ]
◀  novembro de 2026  ▶
Saldo anterior ................................... R$ 620,00
Cobranças do mês
  Fatura do cartão · 50% · 3/10 ...... R$ 350,00  parcial (falta R$ 100,00)
  Internet · 50% ...................... R$ 60,00   em aberto
Total devido ................................... R$ 1.030,00
Pagamentos do mês
  15/11 .................................. R$ 250,00
Saldo final (passa para dezembro) ................ R$ 780,00
```

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver e cadastrar as pessoas (Priority: P1)

A família abre Pessoas e vê cada pessoa com quanto deve até agora e quanto vence no mês atual;
cadastra uma nova, renomeia ou remove.

**Why this priority**: sem pessoas cadastradas pela tela, a divisão de despesas e contas fixas não
pode ser usada; e "quem deve quanto" é a pergunta principal desta área.

**Independent Test**: com pessoas e cobranças registradas pela API, abrir a lista, cadastrar,
renomear e remover.

**Acceptance Scenarios**:

1. **Given** Esposa e Sogro com cobranças e pagamentos, **When** a família abre Pessoas, **Then** vê
   cada pessoa em ordem alfabética com "deve até agora" e "no mês" (valores da API), e o total que
   todas devem até agora.
2. **Given** uma pessoa com crédito (pagou a mais), **When** a lista aparece, **Then** o valor é
   mostrado como crédito ("crédito de R$ 50,00"), não como dívida negativa.
3. **Given** o formulário "Nova pessoa", **When** a família informa "Cunhado" e salva, **Then** ele
   aparece na lista (sem dívida) e um aviso confirma "Pessoa cadastrada."; nome vazio, acima de 100
   caracteres ou repetido mostra a mensagem (as recusas da API aparecem como vieram).
4. **Given** uma pessoa, **When** a família a renomeia, **Then** o novo nome aparece na lista e nas
   despesas/contas divididas com ela, e um aviso confirma "Pessoa renomeada.".
5. **Given** uma pessoa sem cobranças, pagamentos ou despesas, **When** a família a remove e
   confirma, **Then** ela some da lista com "Pessoa removida."; **Given** uma pessoa com lançamentos,
   **Then** a mensagem da API aparece no diálogo e ela continua na lista.
6. **Given** não há pessoas, **When** a família abre a área, **Then** vê um estado vazio explicando
   para que serve e a ação "Nova pessoa".

---

### User Story 2 - Ver o extrato do mês da pessoa (Priority: P1)

A família abre uma pessoa e vê, para o mês escolhido, o saldo que veio do mês anterior, as cobranças
do mês com a situação de cada uma, os pagamentos e o saldo que passa para o mês seguinte.

**Why this priority**: é o que a família confere com a pessoa todo mês ("você me deve isto, pagou
aquilo, ficou faltando tanto").

**Independent Test**: com cobranças e pagamentos pela API, abrir o extrato, navegar entre meses e
conferir saldos e situações.

**Acceptance Scenarios**:

1. **Given** a Esposa com saldo anterior de R$ 620,00, cobranças de R$ 350,00 e R$ 60,00 e um
   pagamento de R$ 250,00 em novembro, **When** a família abre o extrato de novembro, **Then** vê
   saldo anterior, cada cobrança (descrição, origem, parcela n/total quando houver, data, valor e
   situação: paga, parcial com quanto falta, ou em aberto), total devido, cada pagamento (data,
   valor, observação), total pago e saldo final, todos com os valores da API.
2. **Given** o extrato de novembro, **When** a família avança para dezembro, **Then** o saldo
   anterior de dezembro é o saldo final de novembro.
3. **Given** um mês em que a pessoa terminou com crédito, **When** a família vê o extrato, **Then** o
   saldo final aparece como "crédito de R$ X".
4. **Given** um mês sem cobranças nem pagamentos, **When** a família o abre, **Then** vê só o saldo
   anterior e o saldo final iguais, com o aviso "Nada lançado neste mês".
5. **Given** uma cobrança que veio de uma despesa ou conta fixa, **When** a família toca nela,
   **Then** vai para a despesa (tela de Despesas, detalhe aberto) ou para a conta fixa (tela de Contas
   fixas, detalhe aberto).
6. **Given** a família recarrega a página, **When** a tela reabre, **Then** pessoa, aba e mês
   continuam os mesmos (ficam no endereço).

---

### User Story 3 - Registrar um pagamento (Priority: P1)

Quando a pessoa paga (tudo ou parte), a família registra o valor e a data; opcionalmente escolhe
quais cobranças aquele pagamento quita primeiro.

**Why this priority**: sem pagamentos, a dívida só cresce; é a ação mais frequente da área.

**Independent Test**: registrar pagamentos totais e parciais, com e sem escolha de cobranças, e
conferir situações e saldos.

**Acceptance Scenarios**:

1. **Given** a Esposa devendo R$ 1.030,00, **When** a família toca em "Pagamento" (na lista ou no
   detalhe), vê o valor sugerido igual ao devido no mês e registra R$ 250,00 hoje,
   **Then** o pagamento aparece no extrato do mês, o saldo final diminui R$ 250,00, as cobranças mais
   antigas em aberto passam a "paga" ou "parcial" pela regra da API, e um aviso confirma "Pagamento
   registrado.".
2. **Given** o formulário de pagamento, **When** a família marca a cobrança "Internet · novembro"
   como a que deve ser quitada, **Then** o pagamento abate primeiro ela e só a sobra vai para as
   mais antigas.
3. **Given** um pagamento maior do que o devido, **When** a família salva, **Then** a sobra vira
   crédito e o saldo aparece como crédito.
4. **Given** valor zero, data futura ou vazia, **When** a família tenta salvar, **Then** o campo
   mostra a mensagem; recusas da API aparecem como vieram.
5. **Given** o pagamento registrado, **When** a família vê Receitas no mês do pagamento, **Then** o
   reembolso da pessoa reflete o valor pago.

---

### User Story 4 - Cobranças avulsas (Priority: P2)

A família lança um valor que a pessoa deve fora das despesas (ex.: "Sogro usou o cartão — R$
180,00"), edita ou remove.

**Why this priority**: cobre casos que não são despesa da família; menos frequente que as cobranças
automáticas.

**Independent Test**: lançar, editar e remover uma cobrança avulsa e conferir o extrato e o resumo.

**Acceptance Scenarios**:

1. **Given** o formulário "Cobrança avulsa", **When** a família informa descrição "Usou o cartão",
   R$ 180,00 e data, **Then** a cobrança aparece no extrato do mês da data, em aberto, e um aviso
   confirma "Cobrança lançada.".
2. **Given** uma cobrança avulsa no extrato, **When** a família a edita (valor, data, descrição),
   **Then** o extrato reflete a mudança com "Cobrança atualizada."; ao remover e
   confirmar, ela some com "Cobrança removida.".
3. **Given** cobranças que vieram de despesas ou contas fixas, **When** a família as vê no extrato,
   **Then** não há editar/remover nelas (mudam pela despesa ou conta fixa).
4. **Given** descrição vazia ou acima de 100 caracteres, valor zero ou data vazia, **When** a família
   tenta salvar, **Then** o campo mostra a mensagem.

---

### User Story 5 - Resumo geral por origem (Priority: P2)

A família vê, para uma pessoa, cada origem de dívida (cada despesa dividida, conta fixa ou cobrança
avulsa) com quanto já venceu, quanto foi pago e quanto falta, e os totais "deve até hoje" e "deve no
total" (incluindo parcelas futuras).

**Why this priority**: responde "quanto falta da fatura do sogro?" sem somar mês a mês; vem depois
do extrato.

**Independent Test**: com origens variadas pela API, abrir o resumo e conferir linhas e totais.

**Acceptance Scenarios**:

1. **Given** o Sogro com a "Geladeira" em 10× (3 vencidas), **When** a família abre o resumo geral,
   **Then** a linha mostra "3 de 10 cobranças vencidas", total, pago, quanto falta e a origem
   ("despesa"), com os valores da API.
2. **Given** uma conta fixa sem fim dividida com a pessoa, **When** o resumo aparece, **Then** a linha
   mostra o valor mensal e "sem fim", contando só até o mês atual.
3. **Given** o resumo, **When** a família vê os totais, **Then** aparecem "deve até hoje", "deve no
   total" e, se houver, "crédito não usado".
4. **Given** a família toca numa origem que é despesa ou conta fixa, **When** a navegação acontece,
   **Then** abre o detalhe dela na tela correspondente.

---

### User Story 6 - Editar e remover pagamentos (Priority: P2)

A família corrige um pagamento registrado errado ou o remove.

**Why this priority**: correções são necessárias, mas menos frequentes que registrar.

**Independent Test**: editar valor/data/cobranças escolhidas de um pagamento e removê-lo, conferindo
o extrato.

**Acceptance Scenarios**:

1. **Given** um pagamento no extrato, **When** a família o edita (valor, data, observação, cobranças
   escolhidas), **Then** situações e saldos são recalculados pela API e um aviso confirma "Pagamento
   atualizado.".
2. **Given** um pagamento, **When** a família o remove e confirma, **Then** ele some, as cobranças
   voltam a ficar em aberto conforme a regra e um aviso confirma "Pagamento removido.".

---

### Edge Cases

- Pessoa removida em outro aparelho: abrir o endereço dela mostra a mensagem da API e volta à lista.
- Mês fora de 2000-01..2100-12 ou inválido no endereço: abre o mês atual.
- Extrato de mês futuro: mostra as cobranças já previstas (parcelas e contas fixas) e nenhum
  pagamento.
- Pagamento escolhendo uma cobrança que acabou de ser quitada por outro: a API recusa ou ignora; a
  tela mostra o que a API devolver.
- Muitas cobranças no mês (várias despesas divididas): a lista rola sem quebrar o layout no celular.
- Remover uma cobrança avulsa já abatida por pagamentos: os pagamentos são realocados pela API.
- Sem conexão e sessão expirada seguem as regras das features 005 a 008.

## Requirements *(mandatory)*

### Functional Requirements

**Lista de pessoas**

- **FR-001**: A tela MUST listar as pessoas em ordem alfabética com "deve até agora" e "no mês"
  (valores da API), mostrando valores negativos como crédito, e o total devido até agora por todas.
- **FR-002**: A família MUST poder cadastrar (nome obrigatório, até 100 caracteres), renomear e
  remover pessoas (remoção com confirmação; recusas da API no diálogo).

**Detalhe da pessoa**

- **FR-003**: O detalhe MUST ser uma página própria (`/pessoas/{id}`) com voltar para a lista, duas
  abas — **Extrato do mês** (padrão) e **Resumo geral** — e as ações "Pagamento" e "Cobrança avulsa";
  aba e mês MUST ficar no endereço.
- **FR-004**: O extrato MUST mostrar, para o mês escolhido (padrão: atual; anterior/próximo e escolha
  direta), saldo anterior, cobranças (descrição, origem, parcela n/total, data, valor, situação com o
  que falta), total devido, pagamentos (data, valor, observação), total pago e saldo final — todos da
  API; crédito MUST aparecer como "crédito de R$ X".
- **FR-005**: Cobranças vindas de despesas ou contas fixas MUST levar ao detalhe da despesa ou conta
  fixa nas respectivas telas e MUST NOT ter editar/remover.
- **FR-006**: O resumo geral MUST mostrar uma linha por origem (descrição, tipo de origem, cobranças
  vencidas de total, valor mensal e "sem fim" quando for o caso, total, pago, falta) e os totais
  "deve até hoje", "deve no total" e "crédito não usado" (quando houver), todos da API.

**Pagamentos**

- **FR-007**: A família MUST poder registrar pagamento com valor (> 0), data (obrigatória, não
  futura; padrão hoje), observação (até 500) e, opcionalmente, as cobranças que ele quita primeiro
  (só cobranças ainda não totalmente pagas, escolhidas numa lista com descrição, mês e quanto falta).
- **FR-008**: A família MUST poder editar e remover pagamentos (remoção com confirmação).
- **FR-015**: Cada pessoa na lista MUST ter a ação "Pagamento", que abre o formulário de pagamento
  daquela pessoa com o valor sugerido igual ao devido no mês atual (editável; sem sugestão quando não
  deve nada).

**Cobranças avulsas**

- **FR-009**: A família MUST poder lançar, editar e remover cobranças avulsas com descrição
  (obrigatória, até 100), valor (> 0) e data (obrigatória; padrão hoje). A observação da cobrança
  não é oferecida nesta tela: o extrato da API não a devolve, e editar a cobrança a apagaria
  (decisão do plano, research.md §6).

**Integração com as outras telas**

- **FR-010**: Na tela de Receitas, tocar num reembolso MUST abrir a pessoa correspondente (extrato
  do mês do reembolso), em vez da lista geral.
- **FR-011**: Depois de qualquer mudança (pessoa, cobrança, pagamento), lista, extrato, resumo geral,
  o resumo do mês (reembolsos em Receitas) e a lista de pessoas usada nos seletores de despesas e
  contas fixas MUST refletir o novo estado.

**Gerais**

- **FR-012**: Formulários MUST usar o painel responsivo (diálogo no computador, de baixo no
  celular); operações concluídas MUST mostrar aviso breve; mensagens da API MUST aparecer como
  vieram.
- **FR-013**: Listas MUST mostrar carregamento, estado vazio com ação e, em falha, mensagem com
  "Tentar novamente".
- **FR-014**: Textos em português, valores em reais, datas dd/mm/aaaa, meses por extenso; a tela
  MUST funcionar de 360 px a 1920 px sem rolagem horizontal.

### Key Entities

- **Pessoa**: nome, deve até agora, devido no mês atual.
- **Cobrança**: origem (despesa dividida, conta fixa dividida ou avulsa), descrição, parcela n/total,
  data, valor, pago, falta, situação (em aberto, parcial, paga).
- **Pagamento**: valor, data, observação, cobranças escolhidas para quitar primeiro.
- **Extrato do mês**: saldo anterior, cobranças, total devido, pagamentos, total pago, saldo final.
- **Resumo geral**: origens (descrição, tipo, vencidas/total, valor mensal, sem fim, total, pago,
  falta) e totais deve até hoje, deve no total, crédito não usado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Registrar um pagamento leva menos de 20 segundos a partir da lista de pessoas.
- **SC-002**: A família encontra quanto uma pessoa deve até hoje em no máximo 1 toque a partir da
  lista (já visível na lista) e o detalhe por origem em no máximo 2.
- **SC-003**: Saldos, totais e situações exibidos são sempre os da API (nenhum cálculo de abatimento
  feito pela tela).
- **SC-004**: 100% das recusas da API aparecem junto da ação que as causou.
- **SC-005**: A tela funciona sem rolagem horizontal de 360 px a 1920 px.

## Assumptions

- Todo o comportamento já existe na API (feature 004): pessoas, cobranças avulsas, pagamentos com
  escolha de cobranças, regra de abatimento, extrato mensal e resumo por origem. Esta feature não
  muda o backend.
- As cobranças automáticas (despesas e contas fixas divididas) continuam sendo criadas pelas telas
  de Despesas e Contas fixas; aqui só são consultadas.
- O id do reembolso no resumo mensal é o id da pessoa (usado para o atalho de FR-010).
- Reaproveita os componentes das features 005 a 008: `MonthPicker`, `MoneyInput`, painel
  responsivo, `ConfirmDialog`, estado no endereço, carregamento sob demanda.
- Fora de escopo: Resumo do mês da família (feature 010), envio de cobrança por mensagem/WhatsApp,
  anexos de comprovantes, juros ou multas por atraso.
