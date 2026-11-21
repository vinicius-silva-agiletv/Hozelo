import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { errorMessages } from '@/lib/api'
import { useDocumentTitle } from '@/lib/use-document-title'

import { useLogin } from '../hooks'
import { loginSchema, type LoginForm } from '../schemas'
import { useSession } from '../use-session'

export function LoginPage() {
  useDocumentTitle('Entrar')
  const [params] = useSearchParams()
  const expired = params.get('expirada') === '1'
  const back = params.get('voltar')
  const { signIn } = useSession()
  const login = useLogin()

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', keepSignedIn: true },
  })

  // Após signIn, RedirectIfAuthenticated leva para `voltar` (ou o resumo).
  const onSubmit = form.handleSubmit((values) =>
    login.mutate(
      { email: values.email, password: values.password },
      { onSuccess: (data) => signIn(data.tokens.accessToken, data.name, values.keepSignedIn) },
    ),
  )

  const registerLink = back ? `/cadastro?voltar=${encodeURIComponent(back)}` : '/cadastro'

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-sm text-muted-foreground">Acesse a conta da família.</p>
      </div>

      {expired && !login.isError && (
        <Alert>
          <Info aria-hidden />
          <AlertDescription>Sua sessão expirou. Entre novamente.</AlertDescription>
        </Alert>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <FieldGroup>
          <Field data-invalid={!!form.formState.errors.email}>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              aria-invalid={!!form.formState.errors.email}
              {...form.register('email')}
            />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>

          <Field data-invalid={!!form.formState.errors.password}>
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!form.formState.errors.password}
              {...form.register('password')}
            />
            <FieldError errors={[form.formState.errors.password]} />
          </Field>

          <Controller
            control={form.control}
            name="keepSignedIn"
            render={({ field }) => (
              <Field orientation="horizontal">
                <Checkbox
                  id="keepSignedIn"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                <FieldLabel htmlFor="keepSignedIn" className="font-normal">
                  Manter conectado
                </FieldLabel>
              </Field>
            )}
          />
        </FieldGroup>

        {login.isError && <ApiErrorAlert messages={errorMessages(login.error)} />}

        <Button type="submit" className="w-full" size="lg" disabled={login.isPending}>
          {login.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {login.isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Primeiro acesso?{' '}
        <Link to={registerLink} className="font-medium text-foreground underline-offset-4 hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  )
}
