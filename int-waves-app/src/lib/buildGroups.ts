import type { Broadcast, BuildResult, SiteDb, SiteGroup } from '../types'
import { createSiteResolver } from './resolveSite'

/** Привязывает передачи к передатчикам и объединяет те, что стоят в одной точке. */
export function buildGroups(broadcasts: Broadcast[], db: SiteDb): BuildResult {
  const resolve = createSiteResolver(db)
  const groups = new Map<string, SiteGroup>()
  let unresolved = 0

  for (const b of broadcasts) {
    const site = resolve(b.itu, b.remarks)
    if (!site) {
      unresolved++
      continue
    }

    const key = site.approximate
      ? `~${site.country}`
      : `${site.lat.toFixed(3)},${site.lon.toFixed(3)}`

    let group = groups.get(key)
    if (!group) {
      group = {
        key,
        lat: site.lat,
        lon: site.lon,
        country: site.country,
        names: [],
        approximate: site.approximate,
        broadcasts: [],
      }
      groups.set(key, group)
    }
    if (!group.names.includes(site.name)) group.names.push(site.name)
    group.broadcasts.push(b)
  }

  return { groups: [...groups.values()], total: broadcasts.length, unresolved }
}