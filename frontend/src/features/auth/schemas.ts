import { z } from 'zod'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const email = z
  .string()
  .trim()
  .min(1, 'Informe o e-mail.')
  .refine((value) => EMAIL_PATTERN.test(value), 'Informe um e-mail válido.')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha.'),
  keepSignedIn: z.boolean(),
})

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(100, 'O nome deve ter no máximo 100 caracteres.'),
  email,
  password: z.string().min(1, 'Informe a senha.').min(8, 'A senha deve ter no mínimo 8 caracteres.'),
})

export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>
