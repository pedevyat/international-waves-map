/** Верхняя граница коротких волн, кГц. */
export const MAX_KHZ = 30000

export interface FreqRange {
  /** Границы в кГц, включительно. */
  min: number
  max: number
  /** true, если заполнено хотя бы одно поле. */
  active: boolean
  fromInvalid: boolean
  toInvalid: boolean
}

function parseKhz(text: string): { value: number | null; invalid: boolean } {
  const s = text.trim().replace(',', '.')
  if (s === '') return { value: null, invalid: false }
  const value = Number(s)
  if (!Number.isFinite(value) || value < 0) return { value: null, invalid: true }
  return { value, invalid: false }
}

/**
 * Пустое «от» — от 0, пустое «до» — до 30000 кГц, оба пустых — без ограничения.
 * Нечисловой ввод считается пустым полем (и подсвечивается как ошибка).
 * Если «от» больше «до», границы меняются местами.
 */
export function parseFreqRange(fromText: string, toText: string): FreqRange {
  const from = parseKhz(fromText)
  const to = parseKhz(toText)

  let min = from.value ?? 0
  let max = to.value ?? MAX_KHZ
  if (from.value !== null && to.value !== null && min > max) [min, max] = [max, min]

  return {
    min,
    max,
    active: from.value !== null || to.value !== null,
    fromInvalid: from.invalid,
    toInvalid: to.invalid,
  }
}

export function inFreqRange(freqKhz: number, range: FreqRange): boolean {
  return freqKhz >= range.min && freqKhz <= range.max
}