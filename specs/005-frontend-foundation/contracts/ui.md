# UI Contract: Fundação do Frontend

**Feature**: `005-frontend-foundation`

Contrato das rotas, da API consumida e dos componentes compartilhados que as próximas features vão
usar.

## Rotas

| Caminho | Tela | Acesso | Título da aba |
|---|---|---|---|
| `/entrar` | Entrar (query: `expirada=1`, `voltar=/caminho`) | só sem sessão | Entrar · Hozelo |
| `/cadastro` | Criar conta | só sem sessão | Criar conta · Hozelo |
| `/` | Resumo do mês (em construção) | com sessão | Resumo do mês · Hozelo |
| `/despesas` | Despesas (em construção) | com sessão | Despesas · Hozelo |
| `/receitas` | Receitas (em construção) | com sessão | Receitas · Hozelo |
| `/contas-fixas` | Contas fixas (em construção) | com sessão | Contas fixas · Hozelo |
| `/pessoas` | Pessoas (em construção) | com sessão | Pessoas · Hozelo |
| `/configuracoes` | Configurações (em construção) | com sessão | Configurações · Hozelo |
| `*` | Página não encontrada | todos | Página não encontrada · Hozelo |

- Sem sessão em rota protegida → `/entrar?voltar=<caminho>`.
- Com sessão em `/entrar` ou `/cadastro` → `/`.
- Após entrar: `voltar` (se interno) ou `/`.

## API consumida (feature 001)

| Chamada | Uso | Tratamento |
|---|---|---|
| `POST /api/login` `{ email, password }` | entrar | 200 → sessão; 401/429 → mensagens da API no formulário |
| `POST /api/users` `{ name, email, password }` | criar conta | 201 → sessão; 400 → mensagens; 409 → mensagem + link "Ir para a entrada" |
| `GET /api/users` | perfil (nome no menu) | 200 → atualiza nome; 401 → sessão expirada |

Toda requisição com token que receber 401 encerra a sessão (exceto as de entrar/cadastrar, que não
enviam token). Erro de rede → "Não foi possível conectar. Verifique sua conexão e tente novamente."

## Componentes compartilhados (`src/components/shared`)

```tsx
<PageHeader title="Despesas" description="Contas e compras da família." actions={<Button>Registrar</Button>} />

<EmptyState icon={Receipt} title="Nenhuma despesa ainda" description="Registre a primeira."
            action={<Button>Registrar despesa</Button>} />

<MoneyInput value={amount} onChange={setAmount} id="amount" aria-invalid={!!error} />
// value/onChange em reais (number, 2 casas); digitação pelos centavos

<MonthPicker value="2026-11" onChange={setMonth} />
// "novembro de 2026", anterior/próximo, "Mês atual"; limites 2000-01..2100-12

<ConfirmDialog open={open} onOpenChange={setOpen} title="Remover despesa?"
               description="Esta ação não pode ser desfeita." confirmLabel="Remover"
               destructive pending={isPending} onConfirm={remove} />
```

## Hooks e utilitários públicos

| Nome | Onde | Uso |
|---|---|---|
| `useSession()` | `features/auth` | `{ isAuthenticated, accountName, signIn(token, name, persistent), signOut() }` |
| `useDocumentTitle(title)` | `lib` | título da aba |
| `formatCurrency`, `formatDate` | `lib/format.ts` | já existentes |
| `addMonths`, `formatMonth`, `currentMonth` | `lib/month.ts` | meses `"yyyy-MM"` |
