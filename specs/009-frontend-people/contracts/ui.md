# UI Contract: Tela de Pessoas

**Feature**: `009-frontend-people`

## Rotas

| Caminho | Tela | Título da aba |
|---|---|---|
| `/pessoas` | Lista de pessoas (substitui "em construção"; sob demanda) | Pessoas · Hozelo |
| `/pessoas/:id?aba=&mes=` | Pessoa: Extrato do mês / Resumo geral (sob demanda) | {Nome} · Hozelo |

Atalho de Receitas (FR-010): reembolso → `/pessoas/{sourceId}?mes={yyyy-MM}`.

## API consumida

| Chamada | Uso | Resposta / tratamento |
|---|---|---|
| `GET /api/people` | lista | erro → mensagem + "Tentar novamente" |
| `POST /api/people` `{ name }` | cadastrar | 201 → aviso; 400/409 → formulário |
| `PUT /api/people/{id}` `{ name }` | renomear | 204 → aviso; 400/409 → formulário |
| `DELETE /api/people/{id}` | remover | 204 → aviso; recusa (com lançamentos) no diálogo |
| `GET /api/people/{id}/statement?year=&month=` | extrato | 404 → aviso e volta à lista |
| `GET /api/people/{id}/summary` | resumo geral | idem |
| `POST /api/people/{id}/payments` | registrar pagamento | 201 → aviso; 400 → formulário |
| `PUT /api/people/{id}/payments/{paymentId}` | editar pagamento | 200 → aviso |
| `DELETE /api/people/{id}/payments/{paymentId}` | remover pagamento | 204 → aviso |
| `POST /api/people/{id}/charges` | lançar cobrança avulsa | 201 → aviso |
| `PUT /api/people/{id}/charges/{chargeId}` | editar cobrança avulsa | 200 → aviso |
| `DELETE /api/people/{id}/charges/{chargeId}` | remover cobrança avulsa | 204 → aviso |

## Avisos de sucesso

| Ação | Aviso |
|---|---|
| Pessoa: cadastrar / renomear / remover | "Pessoa cadastrada." / "Pessoa renomeada." / "Pessoa removida." |
| Pagamento: registrar / editar / remover | "Pagamento registrado." / "Pagamento atualizado." / "Pagamento removido." |
| Cobrança: lançar / editar / remover | "Cobrança lançada." / "Cobrança atualizada." / "Cobrança removida." |

## Textos fixos

| Onde | Texto |
|---|---|
| Lista | "Deve até agora", "No mês", "Total devido por todos", "crédito de R$ X" |
| Estado vazio | "Nenhuma pessoa cadastrada" — "Cadastre quem divide despesas com a família para acompanhar quanto cada um deve." |
| Abas | "Extrato do mês", "Resumo geral" |
| Extrato | "Saldo anterior", "Cobranças do mês", "Total devido", "Pagamentos do mês", "Total pago", "Saldo final (passa para {mês seguinte})", "Nada lançado neste mês" |
| Situação | "paga", "parcial · falta R$ X", "em aberto" |
| Origem | "despesa", "conta fixa", "avulsa" |
| Resumo | "N de M vencidas", "R$ X por mês · sem fim", "Deve até hoje", "Deve no total", "Crédito não usado" |
| Pagamento | "Escolher o que este pagamento quita (opcional)" |

## Componentes (`src/features/people/components`)

| Componente | Responsabilidade |
|---|---|
| `PeopleList` | cartões com saldos, "Pagamento" e menu Renomear/Remover |
| `PersonFormDialog` / `DeletePersonDialog` | cadastrar, renomear, remover |
| `StatementView` / `ChargeRow` | extrato do mês |
| `OverviewView` | resumo geral por origem |
| `PaymentFormDialog` | registrar/editar pagamento (escolha opcional de cobranças) |
| `ChargeFormDialog` | lançar/editar cobrança avulsa |
| `DeleteEntryDialog` | remover pagamento ou cobrança |

## Utilitário novo

| Nome | Onde |
|---|---|
| `formatBalance` | `lib/format.ts` |
