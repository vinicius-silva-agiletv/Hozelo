/** Valores em centavos inteiros, para o campo de valor no estilo app de banco (sem erro de arredondamento). */

export const MAX_CENTS = 999_999_999_999 // R$ 9.999.999.999,99

export const toCents = (value: number) => Math.round(value * 100)

export const fromCents = (cents: number) => cents / 100

/** Só os dígitos do texto viram centavos: "R$ 1.250,501" → 1250501. */
export function centsFromDigits(text: string): number {
  const digits = text.replace(/\D/g, '')
  return digits === '' ? 0 : Number(digits)
}

/**
 * Valor colado em qualquer formato comum: "1.250,50", "1250,5", "1250.5", "R$ 1.250,50", "1250".
 * Devolve centavos ou null quando não há número.
 */
export function parseAmountToCents(text: string): number | null {
  const cleaned = text.replace(/[^\d.,]/g, '')
  if (!/\d/.test(cleaned)) return null

  let integerPart = cleaned
  let decimalPart = ''

  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')

  if (lastComma >= 0) {
    // vírgula é o separador decimal; pontos são de milhar
    integerPart = cleaned.slice(0, lastComma)
    decimalPart = cleaned.slice(lastComma + 1)
  } else if (lastDot >= 0 && cleaned.length - lastDot - 1 <= 2) {
    // ponto seguido de 1 ou 2 dígitos é decimal ("1250.5")
    integerPart = cleaned.slice(0, lastDot)
    decimalPart = cleaned.slice(lastDot + 1)
  }

  const integer = Number(integerPart.replace(/\D/g, '') || '0')
  const decimals = Number((decimalPart.replace(/\D/g, '') + '00').slice(0, 2))

  return integer * 100 + decimals
}
