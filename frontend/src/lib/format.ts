const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** 1250.5 → "R$ 1.250,50" */
export const formatCurrency = (value: number) => currency.format(value)

/** "2026-11-21" → "21/11/2026" (sem converter fuso: a API envia datas de calendário). */
export const formatDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}
