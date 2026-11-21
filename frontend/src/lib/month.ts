/** Meses no formato da API: "yyyy-MM" (ex.: "2026-11"). */

export const MIN_MONTH = '2000-01'
export const MAX_MONTH = '2100-12'

const toParts = (month: string) => {
  const [year, m] = month.split('-').map(Number)
  return { year, month: m }
}

const fromParts = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`

export function currentMonth(today: Date = new Date()) {
  return fromParts(today.getFullYear(), today.getMonth() + 1)
}

export function addMonths(month: string, amount: number) {
  const { year, month: m } = toParts(month)
  const index = year * 12 + (m - 1) + amount
  return fromParts(Math.floor(index / 12), (index % 12) + 1)
}

export function isWithinRange(month: string, min = MIN_MONTH, max = MAX_MONTH) {
  return month >= min && month <= max
}

const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

/** "2026-11" → "novembro de 2026" */
export function formatMonth(month: string) {
  const { year, month: m } = toParts(month)
  return formatter.format(new Date(Date.UTC(year, m - 1, 1)))
}
