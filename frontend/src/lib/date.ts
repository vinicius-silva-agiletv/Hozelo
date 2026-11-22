/** Datas de calendário no formato da API: "yyyy-MM-dd" (sem fuso horário). */

const pad = (value: number) => String(value).padStart(2, '0')

export const toIsoDate = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`

export function parseIsoDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return { year, month, day }
}

/** Hoje no fuso do aparelho. */
export const todayIso = (now: Date = new Date()) => toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate())

export const isAfterToday = (iso: string, now: Date = new Date()) => iso > todayIso(now)

/** Último dia do mês (month 1–12). */
export const lastDayOfMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate()

/** Soma meses mantendo o dia, ou o último dia quando o mês não tem esse dia (31/01 + 1 → 28/02). */
export function addMonthsToDate(iso: string, months: number) {
  const { year, month, day } = parseIsoDate(iso)
  const index = year * 12 + (month - 1) + months
  const nextYear = Math.floor(index / 12)
  const nextMonth = (index % 12) + 1
  return toIsoDate(nextYear, nextMonth, Math.min(day, lastDayOfMonth(nextYear, nextMonth)))
}

export const isValidIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const { year, month, day } = parseIsoDate(value)
  return month >= 1 && month <= 12 && day >= 1 && day <= lastDayOfMonth(year, month)
}
