import type { DayRule } from '../types'

const ALWAYS: DayRule = () => true
const NEVER: DayRule = () => false

const NAMES: string[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const NAME_RE = NAMES.join('|')
/** Название дня -> Date#getUTCDay() (0 = воскресенье). */
const JS_DAY: Record<string, number> = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0 }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const RANGE_RE = new RegExp(`^(${NAME_RE})-(${NAME_RE})$`)
const WORDS_RE = new RegExp(`^((?:${NAME_RE})+)$`)
const NTH_RE = new RegExp(`^(\\d)\\.(${NAME_RE})$`)
const NTH_LIST_RE = new RegExp(`^(\\d)((?:${NAME_RE})+)$`)
const DATE_RE = new RegExp(`^(\\d{1,2})(${MONTHS.join('|')})$`)

const splitNames = (s: string): string[] => s.match(/../g) ?? []

const daysInMonth = (d: Date): number =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()

/** Число месяца, на которое приходится n-й указанный день недели. */
function nthWeekdayDate(d: Date, weekday: number, nth: number): number {
  const firstDow = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).getUTCDay()
  return 1 + ((weekday - firstDow + 7) % 7) + 7 * (nth - 1)
}

/**
 * Разбирает столбец «Days» из EiBi (формат описан в README.TXT):
 *   пусто          — каждый день
 *   Mo-Fr, Th-Tu   — диапазоны (в том числе через воскресенье)
 *   SaSu, Tu,Th    — перечисления
 *   1245           — цифрами, 1 = понедельник, 7 = воскресенье
 *   1.Sa           — первая суббота месяца;  1WeFr — первая среда и следующая за ней пятница
 *   Last7          — последнее воскресенье месяца
 *   15Sep          — только в этот день
 *   irr, alt, harm, imod — нерегулярно / запасная частота / гармоника: считаем «не в эфире»
 * Непонятные пометки (tent, test, LSB, USB, Haj, Ram, MF-15 …) не ограничивают дни недели.
 */
export function parseDays(raw: string): DayRule {
  const s = raw.trim()
  if (!s) return ALWAYS
  if (/^(irr|alt|harm|imod)/i.test(s)) return NEVER

  if (/^[1-7]+$/.test(s)) {
    const set = new Set([...s].map((ch) => Number(ch) % 7))
    return (d) => set.has(d.getUTCDay())
  }

  let m = /^Last([1-7])$/.exec(s)
  if (m) {
    const wd = Number(m[1]) % 7
    return (d) => d.getUTCDay() === wd && d.getUTCDate() + 7 > daysInMonth(d)
  }

  m = NTH_RE.exec(s)
  if (m) {
    const nth = Number(m[1])
    const wd = JS_DAY[m[2]]
    return (d) => d.getUTCDate() === nthWeekdayDate(d, wd, nth)
  }

  m = NTH_LIST_RE.exec(s)
  if (m) {
    const nth = Number(m[1])
    const wds = splitNames(m[2]).map((n) => JS_DAY[n])
    return (d) => {
      const first = nthWeekdayDate(d, wds[0], nth)
      return wds.some((wd) => d.getUTCDate() === first + ((wd - wds[0] + 7) % 7))
    }
  }

  m = DATE_RE.exec(s)
  if (m) {
    const day = Number(m[1])
    const month = MONTHS.indexOf(m[2])
    return (d) => d.getUTCDate() === day && d.getUTCMonth() === month
  }

  const set = new Set<number>()
  for (const part of s.split(',')) {
    const p = part.trim()
    const range = RANGE_RE.exec(p)
    if (range) {
      const to = NAMES.indexOf(range[2])
      for (let k = NAMES.indexOf(range[1]); ; k = (k + 1) % 7) {
        set.add(JS_DAY[NAMES[k]])
        if (k === to) break
      }
    } else if (WORDS_RE.test(p)) {
      for (const n of splitNames(p)) set.add(JS_DAY[n])
    } else {
      return ALWAYS
    }
  }
  return (d) => set.has(d.getUTCDay())
}