import { lazy } from 'react'
import { Route, Routes } from 'react-router'

import { navAreas } from '@/app/navigation'
import { RouteBoundary } from '@/components/shared/route-error-boundary'
import { RedirectIfAuthenticated, RequireAuth } from '@/features/auth/session'

import { AppLayout } from './layouts/app-layout'
import { AuthLayout } from './layouts/auth-layout'

// Telas baixadas só quando acessadas (research.md §9); layouts e guardas ficam no pacote inicial.
const LoginPage = lazy(() => import('@/features/auth/pages/login-page').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/features/auth/pages/register-page').then((m) => ({ default: m.RegisterPage })))
const SettingsPage = lazy(() => import('@/features/settings/pages/settings-page').then((m) => ({ default: m.SettingsPage })))
const ExpensesPage = lazy(() => import('@/features/expenses/pages/expenses-page').then((m) => ({ default: m.ExpensesPage })))
const IncomesPage = lazy(() => import('@/features/incomes/pages/incomes-page').then((m) => ({ default: m.IncomesPage })))
const FixedBillsPage = lazy(() => import('@/features/fixed-bills/pages/fixed-bills-page').then((m) => ({ default: m.FixedBillsPage })))
const PeoplePage = lazy(() => import('@/features/people/pages/people-page').then((m) => ({ default: m.PeoplePage })))
const PersonPage = lazy(() => import('@/features/people/pages/person-page').then((m) => ({ default: m.PersonPage })))
const SummaryPage = lazy(() => import('@/features/summary/pages/summary-page').then((m) => ({ default: m.SummaryPage })))
const UnderConstructionPage = lazy(() =>
  import('@/pages/under-construction-page').then((m) => ({ default: m.UnderConstructionPage })),
)
const NotFoundPage = lazy(() => import('@/pages/not-found-page').then((m) => ({ default: m.NotFoundPage })))

/** Áreas que já têm tela própria (as demais mostram "em construção"). */
const BUILT_AREAS = new Set(['summary', 'settings', 'expenses', 'incomes', 'fixedBills', 'people'])

/** Rotas do app (contracts/ui.md). */
export function AppRoutes() {
  return (
    <Routes>
      <Route
        element={
          <RedirectIfAuthenticated>
            <AuthLayout />
          </RedirectIfAuthenticated>
        }
      >
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
      </Route>

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<SummaryPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="/despesas" element={<ExpensesPage />} />
        <Route path="/receitas" element={<IncomesPage />} />
        <Route path="/contas-fixas" element={<FixedBillsPage />} />
        <Route path="/pessoas" element={<PeoplePage />} />
        <Route path="/pessoas/:id" element={<PersonPage />} />
        {navAreas
          .filter((area) => !BUILT_AREAS.has(area.key))
          .map((area) => (
            <Route key={area.key} path={area.path} element={<UnderConstructionPage area={area} />} />
          ))}
      </Route>

      <Route
        path="*"
        element={
          <RouteBoundary>
            <NotFoundPage />
          </RouteBoundary>
        }
      />
    </Routes>
  )
}
