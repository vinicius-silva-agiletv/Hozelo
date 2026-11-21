import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { authApi } from './api'
import { useSession } from './use-session'

export const profileQueryKey = ['profile'] as const

export function useLogin() {
  return useMutation({ mutationFn: authApi.login })
}

export function useRegister() {
  return useMutation({ mutationFn: authApi.register })
}

/** Confirma a sessão ao abrir o app e mantém o nome da conta atualizado no menu. */
export function useProfile() {
  const { isAuthenticated, setAccountName } = useSession()
  const query = useQuery({
    queryKey: profileQueryKey,
    queryFn: authApi.getProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  })

  useEffect(() => {
    if (query.data) setAccountName(query.data.name)
  }, [query.data, setAccountName])

  return query
}
