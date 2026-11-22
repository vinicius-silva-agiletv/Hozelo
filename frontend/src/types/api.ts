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

export type EntryKind = 'Expense' | 'Income'
export type LedgerSource = 'Installment' | 'Income' | 'Recurrence' | 'Reimbursement'

export interface ResponseIncome {
  id: number
  name: string
  category: CategorySummary
  amount: number
  expectedDate: string
  isReceived: boolean
  receivedOn: string | null
  notes: string | null
}

export interface ResponseIncomes {
  incomes: ResponseIncome[]
}

export interface RequestUpdateIncome {
  name: string
  categoryId: number
  amount: number
  expectedDate: string
  notes: string | null
}

export interface RequestIncome extends RequestUpdateIncome {
  /** Registrar já como recebida nesta data (não futura). */
  receivedOn?: string | null
}

export interface ResponseShortRecurrence {
  id: number
  kind: EntryKind
  name: string
  category: CategorySummary
  dayOfMonth: number
  /** "yyyy-MM" */
  startMonth: string
  endMonth: string | null
  isActive: boolean
  currentAmount: number
  notes: string | null
  person: PersonSummary | null
  personPercent: number | null
}

export interface ResponseRecurrenceAmount {
  fromMonth: string
  amount: number
}

export interface ResponseRecurrenceMonth {
  month: string
  /** Valor só deste mês (ajuste). */
  amount: number | null
  skipped: boolean
  settledOn: string | null
}

export interface ResponseRecurrence extends ResponseShortRecurrence {
  amounts: ResponseRecurrenceAmount[]
  months: ResponseRecurrenceMonth[]
}

export interface ResponseRecurrences {
  recurrences: ResponseShortRecurrence[]
}

export interface RequestUpdateRecurrence {
  name: string
  categoryId: number
  dayOfMonth: number
  notes: string | null
  personId: number | null
  personPercent: number | null
}

export interface RequestRecurrence extends RequestUpdateRecurrence {
  kind: EntryKind
  amount: number
  startMonth: string
  endMonth: string | null
}

export interface ResponseLedgerItem {
  source: LedgerSource
  sourceId: number
  direction: EntryKind
  number: number | null
  installmentsCount: number | null
  name: string
  category: CategorySummary | null
  /** "yyyy-MM" */
  month: string
  date: string
  amount: number
  isSettled: boolean
  settledAmount: number | null
  settledOn: string | null
  paidInAdvance: boolean
}

export interface ResponseMonthlySummary {
  year: number
  month: number
  incomes: ResponseLedgerItem[]
  expenses: ResponseLedgerItem[]
  forecast: { incomes: number; expenses: number; balance: number }
  realized: { received: number; paid: number; balance: number }
  pending: { toReceive: number; toPay: number; items: ResponseLedgerItem[] } | null
  accumulated: { previousBalance: number; endBalance: number } | null
  openingBalanceMissing: boolean
}

export type ChargeOriginType = 'Expense' | 'Recurrence' | 'Manual'
export type ChargeStatus = 'Open' | 'Partial' | 'Paid'

export interface RequestPerson {
  name: string
}

export interface RequestPersonCharge {
  description: string
  amount: number
  chargeDate: string
  notes: string | null
}

export interface ResponsePersonCharge {
  id: number
  key: string
  description: string
  amount: number
  chargeDate: string
  notes: string | null
}

export interface RequestPersonPayment {
  amount: number
  paidOn: string
  notes: string | null
  /** Cobranças que este pagamento quita primeiro (opcional). */
  chargeKeys?: string[]
}

export interface ResponsePersonPayment {
  id: number
  amount: number
  paidOn: string
  notes: string | null
  chargeKeys: string[]
}

export interface ResponsePersonChargeItem {
  key: string
  originType: ChargeOriginType
  /** Id da despesa, da recorrência ou da cobrança avulsa. */
  originId: number
  description: string
  number: number | null
  count: number | null
  date: string
  amount: number
  paid: number
  remaining: number
  status: ChargeStatus
}

export interface ResponsePersonStatement {
  person: PersonSummary
  year: number
  month: number
  previousBalance: number
  charges: ResponsePersonChargeItem[]
  totalCharges: number
  totalDue: number
  payments: ResponsePersonPayment[]
  totalPaid: number
  /** Negativo = crédito da pessoa. */
  endBalance: number
}

export interface ResponsePersonOrigin {
  originType: ChargeOriginType
  originId: number
  description: string
  chargesDue: number
  chargesTotal: number
  monthlyAmount: number | null
  total: number
  paid: number
  remaining: number
  isOpenEnded: boolean
}

export interface ResponsePersonOverview {
  person: PersonSummary
  origins: ResponsePersonOrigin[]
  owedUntilNow: number
  owedTotal: number
  unallocatedCredit: number
}
