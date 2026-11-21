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

export type CategoryType = 'Expense' | 'Income'

export interface ResponseCategory {
  id: number
  name: string
  type: CategoryType
  /** Despesas, receitas e recorrências da categoria. */
  entriesCount: number
}

export interface ResponseCategories {
  categories: ResponseCategory[]
}

export interface RequestCategory {
  name: string
  /** Obrigatório na criação; omitido ao renomear (o tipo não muda). */
  type?: CategoryType
}

export interface ResponseOpeningBalance {
  /** Pode ser negativo. */
  amount: number
  /** "yyyy-MM-dd" */
  referenceDate: string
}

export interface RequestOpeningBalance {
  amount: number
  referenceDate: string
}
