import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'

import { ApiErrorAlert } from '@/components/shared/api-error-alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ApiError, errorMessages } from '@/lib/api'
import { useDocumentTitle } from '@/lib/use-document-title'

import { useRegister } from '../hooks'
import { registerSchema, type RegisterForm } from '../schemas'
import { useSession } from '../use-session'

export function RegisterPage() {
  useDocumentTitle('Criar conta')
  const { signIn } = useSession()
  const register = useRegister()

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const onSubmit = form.handleSubmit((values) =>
    register.mutate(values, {
      onSuccess: (data) => signIn(data.tokens.accessToken, data.name, true),
    }),
  )

  const accountExists = register.error instanceof ApiError && register.error.status === 409
  const { errors } = form.formState

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Criar conta</h1>
        <p className="text-sm text-muted-foreground">Uma conta compartilhada para toda a família.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <FieldGroup>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Nome</FieldLabel>
            <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...form.register('name')} />
            <FieldError errors={[errors.name]} />
          </Field>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              aria-invalid={!!errors.email}
              {...form.register('email')}
            />
            <FieldError errors={[errors.email]} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby="password-hint"
              {...form.register('password')}
            />
            <FieldDescription id="password-hint">No mínimo 8 caracteres.</FieldDescription>
            <FieldError errors={[errors.password]} />
          </Field>
        </FieldGroup>

        {register.isError && (
          <ApiErrorAlert messages={errorMessages(register.error)}>
            {accountExists && (
              <Link to="/entrar" className="font-medium underline underline-offset-4">
                Ir para a entrada
              </Link>
            )}
          </ApiErrorAlert>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={register.isPending}>
          {register.isPending && <Loader2 className="animate-spin" aria-hidden />}
          {register.isPending ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link to="/entrar" className="font-medium text-foreground underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
