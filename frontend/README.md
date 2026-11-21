# Hozelo — Frontend

SPA em React que consome a API .NET do Hozelo (`../backend`).

## Stack

| Uso | Biblioteca |
|---|---|
| Build e dev server | Vite 8 + TypeScript |
| UI | React 19 |
| Estilos | Tailwind CSS 4 |
| Componentes | shadcn/ui (Radix, preset Nova, ícones Lucide, fonte Geist) — ficam em `src/components/ui` |
| Rotas | React Router |
| Dados da API | TanStack Query (+ devtools em desenvolvimento) |
| Formulários | React Hook Form + Zod |
| Avisos | Sonner (`toast(...)`) |
| Testes | Vitest + Testing Library + jsdom |

## Comandos

```powershell
npm install
npm run dev        # http://localhost:5173
npm test           # testes uma vez
npm run test:watch # testes em modo watch
npm run lint
npm run build
```

## API

- Em desenvolvimento, chamadas para `/api/*` passam pelo proxy do Vite até `http://localhost:5193`
  (perfil `http` da API). Rode a API antes: `dotnet run --project ../backend/src/Backend/Hozelo.Api`.
- Use `api.get/post/put/delete` de `src/lib/api.ts`: envia o token (`Authorization: Bearer`) e converte o
  formato de erro da API (`{ "errors": [...] }`) em `ApiError` com as mensagens em português.
- Para apontar para outra URL (ex.: produção), defina `VITE_API_URL`.

## Componentes

Adicionar um componente do shadcn/ui:

```powershell
npx shadcn@latest add <nome>
```

O tema claro/escuro segue a preferência do sistema (`src/app/theme.ts`).

## Estrutura

```text
src/
├── app/            # providers (React Query, rotas, tooltips, avisos) e tema
├── components/ui/  # componentes shadcn/ui
├── lib/            # cliente da API, formatação (R$, datas)
├── pages/          # telas
└── test/           # setup e helpers de teste
```
