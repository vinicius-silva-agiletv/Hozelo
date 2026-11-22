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

export type AmountType = 'Total' | 'Installment'
export type ExpenseStatus = 'Open' | 'Paid'

export interface CategorySummary {
  id: number
  name: string
}

export interface PersonSummary {
  id: number
  name: string
}

export interface ResponseMonthlyInstallment {
  expenseId: number
  expenseName: string
  category: CategorySummary
  number: number
  installmentsCount: number
  /** "yyyy-MM-dd" */
  dueDate: string
  amount: number
  isPaid: boolean
  paidOn: string | null
  paidAmount: number | null
  /** Amortizada (paga com desconto). */
  prepaid: boolean
  /** Paga em mês anterior ao do vencimento: aparece no mês do pagamento. */
  paidInAdvance: boolean
}

export interface ResponseMonthlyInstallments {
  year: number
  month: number
  totalAmount: number
  paidAmount: number
  openAmount: number
  installments: ResponseMonthlyInstallment[]
}

export interface ResponseShortExpense {
  id: number
  name: string
  category: CategorySummary
  amountType: AmountType
  totalAmount: number
  installmentAmount: number
  isInstallment: boolean
  installmentsCount: number
  paidInstallments: number
  remainingInstallments: number
  firstDueDate: string
  lastDueDate: string
  nextDueDate: string | null
  paidAmount: number
  discountAmount: number
  remainingAmount: number
  status: ExpenseStatus
  notes: string | null
  person: PersonSummary | null
  personPercent: number | null
}

export interface ResponseExpenses {
  totalPaidAmount: number
  totalRemainingAmount: number
  totalDiscountAmount: number
  expenses: ResponseShortExpense[]
}

export interface ResponseInstallment {
  number: number
  dueDate: string
  amount: number
  isPaid: boolean
  paidOn: string | null
  paidAmount: number | null
  prepaid: boolean
}

export interface ResponseExpense extends ResponseShortExpense {
  installments: ResponseInstallment[]
}

export interface RequestUpdateExpense {
  name: string
  categoryId: number
  amountType: AmountType
  amount: number
  isInstallment: boolean
  installmentsCount: number
  firstDueDate: string
  notes: string | null
  personId: number | null
  personPercent: number | null
}

export interface RequestRegisterExpense extends RequestUpdateExpense {
  alreadyPaidInstallments: number
}

export interface RequestPayInstallment {
  paidOn?: string
}

export interface RequestAmortizeExpense {
  installmentNumbers?: number[]
  quantity?: number
  paidOn?: string
  paidAmount: number
}

export interface ResponsePerson {
  id: number
  name: string
  balanceUntilNow: number
  currentMonthDue: number
}

export interface ResponsePeople {
  people: ResponsePerson[]
}
