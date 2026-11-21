/** Contratos da API consumidos pelo frontend (espelho dos Request/Response da API .NET). */

export interface RequestLogin {
  email: string
  password: string
}

export interface RequestRegisterUser {
  name: string
  email: string
  password: string
}

export interface ResponseRegisteredUser {
  name: string
  tokens: { accessToken: string }
}

export interface ResponseUserProfile {
  name: string
  email: string
}

export interface ResponseError {
  errors: string[]
}
