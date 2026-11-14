import type { CountrySites, Site, SiteDb } from '../types'

// Примеры из README.TXT:
//   AFG: k-Kabul / Pol-e-Charkhi 34N32-69E20
//   AFS: Meyerton 26S35-28E08 except:
//        ct-Cape Town 33S41-18E42
//   ALS: ap-Anchor Point 59N44'58"-151W43'56"
const COORD_RE =
  /(\d{1,2})([NS])\s?(\d{1,2})(?:'(\d{1,2}(?:\.\d+)?)")?\s*-?\s*(\d{1,3})([EW])\s?(\d{1,2})(?:'(\d{1,2}(?:\.\d+)?)")?/

const SECTION_MARK = /shortwavesites/i
const HEADER_RE = /^ {1,5}([A-Za-z0-9]{1,3}):\s*(.*)$/
const CODED_RE = /^([A-Za-z0-9]{1,3})-\s*(.*)$/

interface Coords {
  lat: number
  lon: number
  index: number
}

function parseCoords(text: string): Coords | null {
  const m = COORD_RE.exec(text)
  if (!m) return null
  const lat = (Number(m[1]) + Number(m[3]) / 60 + Number(m[4] ?? 0) / 3600) * (m[2] === 'S' ? -1 : 1)
  const lon = (Number(m[5]) + Number(m[7]) / 60 + Number(m[8] ?? 0) / 3600) * (m[6] === 'W' ? -1 : 1)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  return { lat, lon, index: m.index }
}

function makeSite(text: string): Site | null {
  const c = parseCoords(text)
  if (!c) return null
  const name = text
    .slice(0, c.index)
    .replace(/[\s,\-–]+$/, '')
    .trim()
  return { lat: c.lat, lon: c.lon, name: name || 'Передатчик' }
}

/**
 * Разбирает раздел «Transmitter site codes» из README.TXT.
 * Строка со страной: «   ALG: ad-Adrar 27N52-00W17», продолжения идут с большим отступом.
 * Запись без кода («Meyerton …» после «AFS:») — основной передатчик страны.
 * Площадки без координат (например «xx-Unknown site») пропускаются.
 */
export function parseSites(readme: string): SiteDb {
  const lines = readme.split(/\r?\n/)
  const mark = lines.findIndex((l) => SECTION_MARK.test(l))
  if (mark < 0) throw new Error('В README.TXT не найден раздел с передатчиками')

  const db: SiteDb = new Map()
  let current: CountrySites | null = null

  for (const raw of lines.slice(mark + 1)) {
    if (!raw.trim()) continue

    const header = HEADER_RE.exec(raw)
    let body: string
    if (header) {
      current = { coded: new Map() }
      db.set(header[1], current)
      body = header[2]
    } else {
      body = raw.trim()
    }
    if (!current) continue

    body = body.replace(/\s*except:?\s*$/i, '')

    const coded = CODED_RE.exec(body)
    if (coded) {
      const site = makeSite(coded[2])
      if (site) current.coded.set(coded[1], site)
    } else if (header) {
      const site = makeSite(body)
      if (site) current.main = site
    }
  }
  return db
}