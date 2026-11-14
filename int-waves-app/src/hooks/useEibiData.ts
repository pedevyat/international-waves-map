import { useEffect, useState } from 'react'
import { FREQ_URL, README_URL } from '../config'
import { buildGroups } from '../lib/buildGroups'
import { parseSchedule } from '../lib/parseSchedule'
import { parseSites } from '../lib/parseSites'
import type { BuildResult } from '../types'

export type EibiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: BuildResult }

/** Файлы EiBi бывают в UTF-8 и в Latin-1: пробуем UTF-8, иначе windows-1252. */
async function fetchText(url: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  const buf = await res.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    return new TextDecoder('windows-1252').decode(buf)
  }
}

export function useEibiData(): EibiState {
  const [state, setState] = useState<EibiState>({ status: 'loading' })

  useEffect(() => {
    const ctrl = new AbortController()

    async function load() {
      try {
        const [freq, readme] = await Promise.all([
          fetchText(FREQ_URL, ctrl.signal),
          fetchText(README_URL, ctrl.signal),
        ])
        const data = buildGroups(parseSchedule(freq), parseSites(readme))
        if (data.total === 0) {
          throw new Error(
            'В файле частот не найдено ни одной передачи. Проверьте прокси /eibi в vite.config.ts и имя сезона в src/config.ts.',
          )
        }
        setState({ status: 'ready', data })
      } catch (e) {
        if (ctrl.signal.aborted) return
        setState({ status: 'error', message: e instanceof Error ? e.message : String(e) })
      }
    }

    void load()
    return () => ctrl.abort()
  }, [])

  return state
}