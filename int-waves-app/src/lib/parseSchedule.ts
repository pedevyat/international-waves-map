import type { Broadcast } from '../types'
import { parseDays } from './parseDays'

// Начала столбцов в freq-*.txt (фиксированная ширина):
//   kHz           Time(UTC) Days  ITU Station                Lang. Target   Remarks
//   531           0450-1330       ALG R.Algiers Int.           A,F NAf         fk
const COL = { time: 14, days: 24, itu: 30, station: 34, lang: 58, target: 63, remarks: 69 } as const

const TIME_RE = /^(\d{2})(\d{2})-(\d{2})(\d{2})$/

export function parseSchedule(text: string): Broadcast[] {
  const lines = text.split(/\r?\n/)
  const header = lines.findIndex((l) => l.startsWith('kHz'))
  const result: Broadcast[] = []

  for (let i = header + 1; i < lines.length; i++) {
    const line = lines[i]
    const t = TIME_RE.exec(line.slice(COL.time, COL.days - 1).trim())
    if (!t) continue

    const freq = line.slice(0, COL.time).trim()
    const freqKhz = Number.parseFloat(freq)
    if (!Number.isFinite(freqKhz)) continue

    const daysLabel = line.slice(COL.days, COL.itu).trim()
    result.push({
      id: result.length,
      freq,
      freqKhz,
      start: Number(t[1]) * 60 + Number(t[2]),
      end: Number(t[3]) * 60 + Number(t[4]),
      timeLabel: `${t[1]}:${t[2]}–${t[3]}:${t[4]}`,
      daysLabel,
      days: parseDays(daysLabel),
      itu: line.slice(COL.itu, COL.station).trim(),
      station: line.slice(COL.station, COL.lang).trim(),
      lang: line.slice(COL.lang, COL.target).trim(),
      target: line.slice(COL.target, COL.remarks).trim(),
      remarks: line.slice(COL.remarks).trim(),
    })
  }
  return result
}