/**
 * Divisão de uma despesa (ou conta fixa) com uma pessoa — mesmas regras da API (feature 004):
 * pessoa obrigatória quando a divisão está ligada; parte integral (100%) ou percentual de 1 a 100.
 */
export interface PersonSplitValues {
  splitWithPerson: boolean
  personId: number | null
  shareMode: 'full' | 'percent'
  personPercent: number | null
}

export const emptyPersonSplit: PersonSplitValues = {
  splitWithPerson: false,
  personId: null,
  shareMode: 'full',
  personPercent: null,
}

/** Valores do formulário a partir do que a API devolveu. */
export function personSplitFromApi(person: { id: number } | null, percent: number | null): PersonSplitValues {
  const partial = percent !== null && percent < 100
  return {
    splitWithPerson: person !== null,
    personId: person?.id ?? null,
    shareMode: partial ? 'percent' : 'full',
    personPercent: partial ? percent : null,
  }
}

/** Valida e reporta as mensagens nos campos (usado dentro de `superRefine`). */
export function checkPersonSplit(form: PersonSplitValues, issue: (path: string, message: string) => void) {
  if (!form.splitWithPerson) return
  if (form.personId === null) issue('personId', 'Escolha a pessoa.')
  const percent = form.personPercent
  if (form.shareMode === 'percent' && !(percent !== null && Number.isInteger(percent) && percent >= 1 && percent <= 100)) {
    issue('personPercent', 'Informe um percentual de 1 a 100.')
  }
}

/** `personId`/`personPercent` para o envio (sem pessoa → ambos nulos; integral → 100). */
export function personSplitToRequest(form: PersonSplitValues) {
  const split = form.splitWithPerson && form.personId !== null
  return {
    personId: split ? form.personId : null,
    personPercent: split ? (form.shareMode === 'full' ? 100 : form.personPercent) : null,
  }
}
