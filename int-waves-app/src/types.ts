/** Правило «в этот день передача идёт». Получает дату (UTC), для которой проверяется день. */
export type DayRule = (date: Date) => boolean

/** Одна строка расписания EiBi. */
export interface Broadcast {
  id: number
  freq: string
  freqKhz: number
  /** Минуты от 00:00 UTC. */
  start: number
  /** Минуты от 00:00 UTC, 1440 = 24:00. Если end < start — передача идёт через полночь. */
  end: number
  timeLabel: string
  daysLabel: string
  days: DayRule
  /** Код страны вещателя (ITU). */
  itu: string
  station: string
  lang: string
  target: string
  /** Код передатчика: «fk», «/CYP», «/BLR-mo» и т.п. */
  remarks: string
}

export interface Site {
  lat: number
  lon: number
  name: string
}

export interface CountrySites {
  /** Основной передатчик страны (без кода). */
  main?: Site
  /** Передатчики с кодами. */
  coded: Map<string, Site>
}

/** Код страны ITU -> её передатчики. */
export type SiteDb = Map<string, CountrySites>

/** Все передачи с одного передатчика (одной точки на карте). */
export interface SiteGroup {
  key: string
  lat: number
  lon: number
  country: string
  names: string[]
  /** true — площадка не указана, точка поставлена в центр известных передатчиков страны. */
  approximate: boolean
  broadcasts: Broadcast[]
}

export interface BuildResult {
  groups: SiteGroup[]
  total: number
  /** Сколько передач не удалось привязать к координатам. */
  unresolved: number
}