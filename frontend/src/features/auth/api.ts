import { api } from '@/lib/api'
import type { RequestLogin, RequestRegisterUser, ResponseRegisteredUser, ResponseUserProfile } from '@/types/api'

export const authApi = {
  login: (request: RequestLogin) => api.post<ResponseRegisteredUser>('/login', request),
  register: (request: RequestRegisterUser) => api.post<ResponseRegisteredUser>('/users', request),
  getProfile: () => api.get<ResponseUserProfile>('/users'),
}
