import { Route, Routes } from 'react-router'

import { navAreas } from '@/app/navigation'
import { LoginPage } from '@/features/auth/pages/login-page'
import { RegisterPage } from '@/features/auth/pages/register-page'
import { RedirectIfAuthenticated, RequireAuth } from '@/features/auth/session'
import { NotFoundPage } from '@/pages/not-found-page'
import { UnderConstructionPage } from '@/pages/under-construction-page'

import { AppLayout } from './layouts/app-layout'
import { AuthLayout } from './layouts/auth-layout'

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
        {navAreas.map((area) => (
          <Route key={area.key} path={area.path} element={<UnderConstructionPage area={area} />} />
        ))}
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
