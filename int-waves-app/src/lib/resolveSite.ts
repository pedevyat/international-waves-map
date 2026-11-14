import type { Site, SiteDb } from '../types'

export interface ResolvedSite extends Site {
  /** Страна, где стоит передатчик (может отличаться от страны вещателя). */
  country: string
  approximate: boolean
}

// «/CYP» — передатчик в Кипре, «/BLR-mo» — в Беларуси, площадка «mo»
const REMOTE_RE = /^\/([A-Za-z0-9]{1,3})(?:-(.+))?$/

/** Средняя точка на сфере (корректно работает через 180-й меридиан). */
function centroid(sites: Site[]): { lat: number; lon: number } {
  let x = 0
  let y = 0
  let z = 0
  for (const s of sites) {
    const la = (s.lat * Math.PI) / 180
    const lo = (s.lon * Math.PI) / 180
    x += Math.cos(la) * Math.cos(lo)
    y += Math.cos(la) * Math.sin(lo)
    z += Math.sin(la)
  }
  x /= sites.length
  y /= sites.length
  z /= sites.length
  return {
    lat: (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI,
    lon: (Math.atan2(y, x) * 180) / Math.PI,
  }
}

export function createSiteResolver(db: SiteDb) {
  const centres = new Map<string, Site | null>()

  const countryCentre = (country: string): Site | null => {
    if (centres.has(country)) return centres.get(country) ?? null
    const sites = [...(db.get(country)?.coded.values() ?? [])]
    const centre = sites.length ? { ...centroid(sites), name: 'площадка не указана' } : null
    centres.set(country, centre)
    return centre
  }

  return (itu: string, remarks: string): ResolvedSite | null => {
    let country = itu
    let code = remarks.trim().split(/\s+/)[0] ?? ''

    const remote = REMOTE_RE.exec(code)
    if (remote) {
      country = remote[1]
      code = remote[2] ?? ''
    } else {
      code = code.replace(/^-/, '')
    }

    const entry = db.get(country)
    if (!entry) return null

    if (code) {
      const site =
        entry.coded.get(code) ??
        [...entry.coded].find(([k]) => k.toLowerCase() === code.toLowerCase())?.[1]
      return site ? { ...site, country, approximate: false } : null
    }

    if (entry.main) return { ...entry.main, country, approximate: false }
    if (entry.coded.size === 1) {
      const [only] = entry.coded.values()
      return { ...only, country, approximate: false }
    }

    const centre = countryCentre(country)
    return centre ? { ...centre, country, approximate: true } : null
  }
}