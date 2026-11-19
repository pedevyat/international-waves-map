import type { SiteGroup } from '../types'

/** Верхняя граница КВ-диапазона в списке EiBi, кГц. */
export const MAX_KHZ = 30000

export interface FreqRange {
  min: number
  max: number
}

function toNumber(s: string): number | null {
  const t = s.trim().replace(',', '.')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/**
 * Поля «от» и «до» в кГц.
 *   пусто «от» — от 0 до N;  пусто «до» — от N до 30000;
 *   заполнены оба — от меньшего к большему (если перепутаны, меняем местами);
 *   пусты оба — фильтра нет (null).
 */
export function parseRange(from: string, to: string): FreqRange | null {
  const a = toNumber(from)
  const b = toNumber(to)
  if (a === null && b === null) return null

  let min = a ?? 0
  let max = b ?? Math.max(MAX_KHZ, min)
  if (a !== null && b !== null && a > b) [min, max] = [b, a]
  return { min, max }
}

/**
 * Оставляет у каждой точки только передачи из диапазона; точки без таких передач убираются.
 * Без диапазона возвращает исходный массив.
 */
export function filterByRange(
  groups: SiteGroup[],
  range: FreqRange | null,
): { groups: SiteGroup[]; broadcastCount: number } {
  if (!range) {
    return { groups, broadcastCount: groups.reduce((n, g) => n + g.broadcasts.length, 0) }
  }

  const result: SiteGroup[] = []
  let broadcastCount = 0
  for (const g of groups) {
    const broadcasts = g.broadcasts.filter((b) => b.freqKhz >= range.min && b.freqKhz <= range.max)
    if (broadcasts.length === 0) continue
    broadcastCount += broadcasts.length
    result.push({ ...g, broadcasts })
  }
  return { groups: result, broadcastCount }
}