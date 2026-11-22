const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** 1250.5 → "R$ 1.250,50" */
export const formatCurrency = (value: number) => currency.format(value)

/** "2026-11-21" → "21/11/2026" (sem converter fuso: a API envia datas de calendário). */
export const formatDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

/** pluralize(0, 'lançamento', 'lançamentos', 'Nenhum lançamento') → "Nenhum lançamento"; 3 → "3 lançamentos" */
/** Saldo de uma pessoa: positivo é dívida, negativo é crédito ("crédito de R$ 50,00"). */
export const formatBalance = (value: number) => (value < 0 ? `crédito de ${currency.format(-value)}` : currency.format(value))

export const pluralize = (count: number, singular: string, plural: string, zero?: string) => {
  if (count === 0 && zero !== undefined) return zero
  return `${count} ${count === 1 ? singular : plural}`
}
