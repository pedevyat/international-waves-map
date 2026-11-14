import { useEffect, useState } from 'react'
import { TICK_MS } from '../config'

/** Текущее время, обновляется раз в TICK_MS. */
export function useNow(intervalMs: number = TICK_MS): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}