import { countryName } from './countries'

/**
 * Коды регионов вещания EiBi (раздел «Target-area codes» в README.TXT) -> русские названия.
 * Регистр кодов важен: «NE» — северо-восток, «Ne»-подобных кодов нет.
 */
const TARGETS: Record<string, string> = {
  Af: 'Африка',
  Am: 'Америка',
  As: 'Азия',
  Car: 'Карибский бассейн, Мексиканский залив',
  Cau: 'Кавказ',
  CIS: 'СНГ (бывший СССР)',
  CNA: 'Центр Северной Америки',
  ENA: 'Восток Северной Америки',
  ENE: 'Восток-северо-восток',
  ESE: 'Восток-юго-восток',
  Eu: 'Европа',
  FE: 'Дальний Восток',
  Glo: 'Весь мир',
  In: 'Индийский субконтинент',
  LAm: 'Латинская Америка',
  ME: 'Ближний Восток',
  NAO: 'Северная Атлантика',
  NE: 'Северо-восток',
  NNE: 'Северо-северо-восток',
  NNW: 'Северо-северо-запад',
  NW: 'Северо-запад',
  Oc: 'Океания',
  SAO: 'Южная Атлантика',
  SE: 'Юго-восток',
  SEA: 'Юго-Восточная Азия',
  SEE: 'Юго-Восточная Европа',
  Sib: 'Сибирь',
  SSE: 'Юго-юго-восток',
  SSW: 'Юго-юго-запад',
  SW: 'Юго-запад',
  Tib: 'Тибет',
  WIO: 'Запад Индийского океана',
  WNA: 'Запад Северной Америки',
  WNW: 'Запад-северо-запад',
  WSW: 'Запад-юго-запад',
}

// «C..», «E..», «N..», «S..», «W..» — приставка к региону: NAf — Северная Африка, EEu — Восточная Европа
const SIDES: Record<string, string> = {
  C: 'Центральная',
  E: 'Восточная',
  N: 'Северная',
  S: 'Южная',
  W: 'Западная',
}
const REGIONS: Record<string, string> = {
  Af: 'Африка',
  Am: 'Америка',
  As: 'Азия',
  Eu: 'Европа',
  Oc: 'Океания',
  Sib: 'Сибирь',
}
const COMPOUND_RE = /^([CENSW])(Af|Am|As|Eu|Oc|Sib)$/

const LOWERCASE = new Map(Object.entries(TARGETS).map(([code, name]) => [code.toLowerCase(), name]))

/**
 * Название региона по одному коду. Порядок поиска: готовый код региона, приставка + регион
 * (NAf, EEu …), код страны ITU (если вещание направлено на одну страну, например «ROU»),
 * затем то же без учёта регистра. Неизвестный код возвращается как есть.
 */
export function targetName(code: string): string {
  const c = code.trim()
  if (!c) return ''

  const direct = TARGETS[c]
  if (direct) return direct

  const compound = COMPOUND_RE.exec(c)
  if (compound) return `${SIDES[compound[1]]} ${REGIONS[compound[2]]}`

  return countryName(c) ?? LOWERCASE.get(c.toLowerCase()) ?? c
}

/** Если регионов несколько — они перечислены через запятую. */
export function targetLabel(raw: string): string {
  return raw
    .split(/[,;+/]/)
    .map((c) => c.trim())
    .filter(Boolean)
    .map(targetName)
    .join(', ')
}