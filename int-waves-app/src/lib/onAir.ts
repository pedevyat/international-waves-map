import type { Broadcast } from '../types'

const DAY_MS = 86_400_000

/** Идёт ли передача в момент `now` (время и день недели считаются по UTC). */
export function isOnAir(b: Broadcast, now: Date): boolean {
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes()

  if (b.start < b.end) {
    return minutes >= b.start && minutes < b.end && b.days(now)
  }
  if (b.start > b.end) {
    // через полночь, например 2330-0450: день недели относится к началу передачи
    if (minutes >= b.start) return b.days(now)
    if (minutes < b.end) return b.days(new Date(now.getTime() - DAY_MS))
  }
  return false
}